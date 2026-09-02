import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { firestoreClient } from './firestore';
import { UserRecord, UserSyncPayload, AnalyticsEventRecord, UserRole } from './types';

export class FirestoreDatabase {
  private usersCache: Map<string, UserRecord> = new Map();
  private userSyncCache: Map<string, UserSyncPayload> = new Map();
  private analyticsEventsCache: AnalyticsEventRecord[] = [];
  private isInitialized: boolean = false;
  private saveDebounceTimer: NodeJS.Timeout | null = null;

  constructor() {
    // 1. Prime cache immediately from local backup store
    this.loadFromLocalStore();

    // 2. Initialize and sync from Firestore remote in background
    this.initialize().catch(err => {
      console.warn('[FirestoreDatabase] Remote initialization notice:', err);
    });
  }

  private loadFromLocalStore(): void {
    try {
      const dataDir = path.join(process.cwd(), 'server', 'data');
      const storeFile = path.join(dataDir, 'store.json');
      if (fs.existsSync(storeFile)) {
        const raw = fs.readFileSync(storeFile, 'utf-8');
        const parsed = JSON.parse(raw);
        if (parsed.users && typeof parsed.users === 'object') {
          for (const [id, user] of Object.entries(parsed.users)) {
            if (user && typeof user === 'object' && (user as UserRecord).id) {
              this.usersCache.set(id, user as UserRecord);
            }
          }
        }
        if (parsed.userSyncData && typeof parsed.userSyncData === 'object') {
          for (const [id, sync] of Object.entries(parsed.userSyncData)) {
            if (sync && typeof sync === 'object') {
              this.userSyncCache.set(id, sync as UserSyncPayload);
            }
          }
        }
        if (Array.isArray(parsed.analyticsEvents)) {
          this.analyticsEventsCache = parsed.analyticsEvents;
        }
        console.log(`[FirestoreDatabase] Loaded ${this.usersCache.size} users, ${this.userSyncCache.size} sync docs from persistent store.`);
      }
    } catch (err) {
      console.warn('[FirestoreDatabase] Note: Could not read local store.json:', err);
    }
  }

  private persistToLocalStore(): void {
    try {
      const dataDir = path.join(process.cwd(), 'server', 'data');
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }
      const storeFile = path.join(dataDir, 'store.json');
      const usersObj: Record<string, UserRecord> = {};
      for (const [k, v] of this.usersCache.entries()) {
        usersObj[k] = v;
      }
      const syncObj: Record<string, UserSyncPayload> = {};
      for (const [k, v] of this.userSyncCache.entries()) {
        syncObj[k] = v;
      }
      const payload = {
        users: usersObj,
        userSyncData: syncObj,
        analyticsEvents: this.analyticsEventsCache.slice(-5000),
        meta: {
          version: 1,
          lastUpdated: new Date().toISOString(),
        },
      };
      fs.writeFileSync(storeFile, JSON.stringify(payload, null, 2), 'utf-8');
    } catch (err) {
      console.warn('[FirestoreDatabase] Could not persist to local store.json:', err);
    }
  }

  private debouncedPersist(): void {
    if (this.saveDebounceTimer) {
      clearTimeout(this.saveDebounceTimer);
    }
    this.saveDebounceTimer = setTimeout(() => {
      this.persistToLocalStore();
    }, 1500);
  }

  public async initialize(): Promise<void> {
    try {
      // Try to load users from Firestore
      const usersList = await firestoreClient.listDocs('users', 500);
      for (const u of usersList) {
        if (u && u.id) {
          this.usersCache.set(u.id, u as UserRecord);
        }
      }

      // Try to load userSyncData from Firestore
      const syncList = await firestoreClient.listDocs('userSyncData', 500);
      for (const s of syncList) {
        if (s && s.id) {
          this.userSyncCache.set(s.id, s as UserSyncPayload);
        }
      }

      // Try to load recent analytics events from Firestore
      const analyticsList = await firestoreClient.listDocs('analyticsEvents', 500);
      if (analyticsList.length > 0) {
        const sorted = (analyticsList as AnalyticsEventRecord[]).sort(
          (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        );
        this.analyticsEventsCache = sorted;
      }

      this.isInitialized = true;
      await this.ensureInitialAdmin();
      this.persistToLocalStore();
    } catch (err) {
      console.warn('[FirestoreDatabase] Firestore remote sync note:', err);
      await this.ensureInitialAdmin();
    }
  }

  private async ensureInitialAdmin() {
    const adminEmail = (process.env.ADMIN_EMAIL || 'admin@holybibleplus.app').toLowerCase().trim();
    const adminInitialPassword = process.env.ADMIN_INITIAL_PASSWORD || 'HolyBiblePlusAdmin2026!';

    let hasAdmin = Array.from(this.usersCache.values()).some(u => u.role === 'ADMIN');
    if (!hasAdmin) {
      const existingUser = this.findUserByEmail(adminEmail);
      if (existingUser) {
        existingUser.role = 'ADMIN';
        await firestoreClient.setDoc('users', existingUser.id, existingUser);
        console.log(`[FirestoreDatabase] Upgraded existing user ${adminEmail} to ADMIN.`);
      } else {
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(adminInitialPassword, salt);
        const adminId = 'usr_admin_' + crypto.randomBytes(6).toString('hex');
        const now = new Date().toISOString();

        const adminUser: UserRecord = {
          id: adminId,
          fullName: 'System Administrator',
          email: adminEmail,
          passwordHash,
          googleId: null,
          avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
          authProvider: 'local',
          role: 'ADMIN',
          createdAt: now,
          updatedAt: now,
          lastLoginAt: null,
          lastActiveAt: null,
          isActive: true,
        };

        this.usersCache.set(adminId, adminUser);
        await firestoreClient.setDoc('users', adminId, adminUser);
        console.log(`[FirestoreDatabase] Seeded initial admin ${adminEmail} into Firestore.`);
      }
    }
  }

  // --- USER METHODS ---

  public findUserById(id: string): UserRecord | null {
    return this.usersCache.get(id) || null;
  }

  public async findUserByIdAsync(id: string): Promise<UserRecord | null> {
    const cached = this.usersCache.get(id);
    if (cached) return cached;

    const doc = await firestoreClient.getDoc('users', id);
    if (doc && doc.id) {
      const user = doc as UserRecord;
      this.usersCache.set(user.id, user);
      return user;
    }
    return null;
  }

  public findUserByEmail(email: string): UserRecord | null {
    const normalized = email.toLowerCase().trim();
    for (const u of this.usersCache.values()) {
      if (u.email && u.email.toLowerCase().trim() === normalized) {
        return u;
      }
    }
    return null;
  }

  public async findUserByEmailAsync(email: string): Promise<UserRecord | null> {
    const normalized = email.toLowerCase().trim();
    const cached = this.findUserByEmail(normalized);
    if (cached) return cached;

    // Structured Firestore Query
    const docs = await firestoreClient.runStructuredQuery('users', [
      { field: 'email', op: 'EQUAL', value: normalized }
    ], 1);

    if (docs.length > 0) {
      const user = docs[0] as UserRecord;
      this.usersCache.set(user.id, user);
      return user;
    }
    return null;
  }

  public findUserByGoogleId(googleId: string): UserRecord | null {
    for (const u of this.usersCache.values()) {
      if (u.googleId === googleId) {
        return u;
      }
    }
    return null;
  }

  public async findUserByGoogleIdAsync(googleId: string): Promise<UserRecord | null> {
    const cached = this.findUserByGoogleId(googleId);
    if (cached) return cached;

    // Structured Firestore Query
    const docs = await firestoreClient.runStructuredQuery('users', [
      { field: 'googleId', op: 'EQUAL', value: googleId }
    ], 1);

    if (docs.length > 0) {
      const user = docs[0] as UserRecord;
      this.usersCache.set(user.id, user);
      return user;
    }
    return null;
  }

  public getAllUsers(): UserRecord[] {
    return Array.from(this.usersCache.values());
  }

  public async getAllUsersAsync(): Promise<UserRecord[]> {
    const docs = await firestoreClient.listDocs('users', 500);
    if (docs && docs.length > 0) {
      for (const u of docs as UserRecord[]) {
        if (u && u.id) this.usersCache.set(u.id, u);
      }
      this.persistToLocalStore();
    }
    return Array.from(this.usersCache.values());
  }

  public async createUser(data: {
    fullName: string;
    email: string;
    password?: string;
    googleId?: string | null;
    avatarUrl?: string | null;
    profileImageType?: 'uploaded_photo' | 'avatar' | 'default';
    avatarId?: string | null;
    avatarBgColor?: string | null;
    authProvider?: 'local' | 'google';
    role?: UserRole;
  }): Promise<UserRecord> {
    const normalizedEmail = data.email.toLowerCase().trim();

    if (this.findUserByEmail(normalizedEmail)) {
      throw new Error('An account with this email address already exists.');
    }

    let passwordHash: string | null = null;
    if (data.password) {
      const salt = await bcrypt.genSalt(10);
      passwordHash = await bcrypt.hash(data.password, salt);
    }

    const id = 'usr_' + crypto.randomBytes(8).toString('hex');
    const now = new Date().toISOString();

    const newUser: UserRecord = {
      id,
      fullName: data.fullName.trim(),
      email: normalizedEmail,
      passwordHash,
      googleId: data.googleId || null,
      avatarUrl: data.avatarUrl || null,
      profileImageType: data.profileImageType || (data.avatarUrl ? 'uploaded_photo' : 'default'),
      avatarId: data.avatarId || null,
      avatarBgColor: data.avatarBgColor || null,
      authProvider: data.authProvider || (data.googleId ? 'google' : 'local'),
      role: data.role === 'ADMIN' ? 'ADMIN' : 'USER',
      createdAt: now,
      updatedAt: now,
      lastLoginAt: now,
      lastActiveAt: now,
      isActive: true,
    };

    // Update in-memory cache
    this.usersCache.set(id, newUser);
    this.persistToLocalStore();

    // Save directly to Firestore collection /users/{id}
    firestoreClient.setDoc('users', id, newUser).catch(() => {});

    return newUser;
  }

  public async updateUser(
    id: string,
    updates: Partial<Omit<UserRecord, 'id' | 'passwordHash'>>
  ): Promise<UserRecord | null> {
    let user = this.usersCache.get(id);
    if (!user) {
      user = await this.findUserByIdAsync(id);
    }
    if (!user) return null;

    Object.assign(user, updates, { updatedAt: new Date().toISOString() });
    this.usersCache.set(id, user);
    this.persistToLocalStore();

    // Persist to Firestore
    firestoreClient.setDoc('users', id, user).catch(() => {});
    return user;
  }

  public async setUserPassword(id: string, newPassword: string): Promise<boolean> {
    let user = this.usersCache.get(id);
    if (!user) {
      user = await this.findUserByIdAsync(id);
    }
    if (!user) return false;

    const salt = await bcrypt.genSalt(10);
    user.passwordHash = await bcrypt.hash(newPassword, salt);
    user.passwordResetToken = null;
    user.passwordResetExpires = null;
    user.updatedAt = new Date().toISOString();

    this.usersCache.set(id, user);
    this.persistToLocalStore();
    firestoreClient.setDoc('users', id, user).catch(() => {});
    return true;
  }

  public async verifyPassword(user: UserRecord, password: string): Promise<boolean> {
    if (!user.passwordHash) return false;
    return bcrypt.compare(password, user.passwordHash);
  }

  public recordLogin(id: string) {
    let user = this.usersCache.get(id);
    if (user) {
      const now = new Date().toISOString();
      user.lastLoginAt = now;
      user.lastActiveAt = now;
      this.usersCache.set(id, user);
      this.debouncedPersist();
      firestoreClient.setDoc('users', id, user).catch(() => {});
    }
  }

  public recordActivity(id: string) {
    const user = this.usersCache.get(id);
    if (!user) return;

    const now = new Date();
    if (user.lastActiveAt) {
      const last = new Date(user.lastActiveAt).getTime();
      if (now.getTime() - last < 2 * 60 * 1000) {
        return; // throttled to 2 mins
      }
    }

    user.lastActiveAt = now.toISOString();
    this.usersCache.set(id, user);
    this.debouncedPersist();
    firestoreClient.setDoc('users', id, user).catch(() => {});
  }

  public async setPasswordResetToken(email: string, token: string, expiresMinutes: number = 60): Promise<boolean> {
    let user = this.findUserByEmail(email);
    if (!user) {
      user = await this.findUserByEmailAsync(email);
    }
    if (!user) return false;

    user.passwordResetToken = token;
    user.passwordResetExpires = new Date(Date.now() + expiresMinutes * 60 * 1000).toISOString();
    this.usersCache.set(user.id, user);
    this.persistToLocalStore();
    firestoreClient.setDoc('users', user.id, user).catch(() => {});
    return true;
  }

  public findUserByResetToken(token: string): UserRecord | null {
    if (!token) return null;
    const now = new Date().getTime();
    for (const u of this.usersCache.values()) {
      if (u.passwordResetToken === token && u.passwordResetExpires) {
        if (new Date(u.passwordResetExpires).getTime() > now) {
          return u;
        }
      }
    }
    return null;
  }

  public async findUserByResetTokenAsync(token: string): Promise<UserRecord | null> {
    const cached = this.findUserByResetToken(token);
    if (cached) return cached;

    const docs = await firestoreClient.runStructuredQuery('users', [
      { field: 'passwordResetToken', op: 'EQUAL', value: token }
    ], 1);

    if (docs.length > 0) {
      const user = docs[0] as UserRecord;
      const now = new Date().getTime();
      if (user.passwordResetExpires && new Date(user.passwordResetExpires).getTime() > now) {
        this.usersCache.set(user.id, user);
        return user;
      }
    }
    return null;
  }

  // --- USER DATA SYNC METHODS ---

  public getUserSyncData(userId: string): UserSyncPayload | null {
    return this.userSyncCache.get(userId) || null;
  }

  public async getUserSyncDataAsync(userId: string): Promise<UserSyncPayload | null> {
    const cached = this.userSyncCache.get(userId);
    if (cached) return cached;

    const doc = await firestoreClient.getDoc('userSyncData', userId);
    if (doc) {
      const payload = doc as UserSyncPayload;
      this.userSyncCache.set(userId, payload);
      this.debouncedPersist();
      return payload;
    }
    return null;
  }

  public saveUserSyncData(userId: string, payload: UserSyncPayload) {
    const existing = this.userSyncCache.get(userId) || {};
    const updated: UserSyncPayload = {
      ...existing,
      ...payload,
      updatedAt: new Date().toISOString(),
    };

    this.userSyncCache.set(userId, updated);
    this.debouncedPersist();
    // Write directly to Firestore document /userSyncData/{userId}
    firestoreClient.setDoc('userSyncData', userId, updated).catch(() => {});
  }

  // --- ANALYTICS EVENT METHODS ---

  public recordAnalyticsEvent(
    eventType: string,
    userId: string | null,
    sessionId: string,
    metadata?: Record<string, string | number | boolean | null>
  ) {
    const eventId = 'evt_' + crypto.randomBytes(8).toString('hex');
    const event: AnalyticsEventRecord = {
      id: eventId,
      userId: userId || null,
      sessionId: sessionId || 'sess_anon',
      eventType,
      timestamp: new Date().toISOString(),
      metadata: metadata || {},
    };

    this.analyticsEventsCache.push(event);
    if (this.analyticsEventsCache.length > 50000) {
      this.analyticsEventsCache = this.analyticsEventsCache.slice(-50000);
    }
    this.debouncedPersist();

    // Write to Firestore /analyticsEvents/{eventId}
    firestoreClient.setDoc('analyticsEvents', eventId, event).catch(() => {});
  }

  public getAnalyticsEvents(): AnalyticsEventRecord[] {
    return this.analyticsEventsCache;
  }

  public sanitizeUser(user: UserRecord) {
    const { passwordHash, passwordResetToken, passwordResetExpires, ...safe } = user;
    return safe;
  }
}

export const firestoreDb = new FirestoreDatabase();
