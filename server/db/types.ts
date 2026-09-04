export type UserRole = 'USER' | 'ADMIN';
export type AuthProvider = 'local' | 'google';
export type ProfileImageType = 'uploaded_photo' | 'avatar' | 'default';

export interface UserRecord {
  id: string;
  fullName: string;
  email: string; // normalized lower-case
  passwordHash: string | null;
  googleId: string | null;
  avatarUrl: string | null;
  avatarStoragePath?: string | null;
  profileImageType?: ProfileImageType;
  avatarId?: string | null;
  avatarBgColor?: string | null;
  authProvider: AuthProvider;
  role: UserRole;
  createdAt: string; // ISO
  updatedAt: string; // ISO
  lastLoginAt: string | null;
  lastActiveAt: string | null;
  isActive: boolean;
  passwordResetToken?: string | null;
  passwordResetExpires?: string | null;
}

export interface UserSyncPayload {
  bookmarks?: any[];
  highlights?: any[];
  notes?: any[];
  readingProgress?: any;
  readingPlans?: any[];
  prayerRequests?: any[];
  readerSettings?: any;
  favoriteSongIds?: string[];
  notificationSettings?: any;
  audioSpeed?: number;
  selectedBibleId?: string;
  votdSelectedBg?: string;
  updatedAt?: string;
}

export interface AnalyticsEventRecord {
  id: string;
  userId: string | null; // null for anonymous / unauthenticated events
  sessionId: string;
  eventType: string;
  timestamp: string; // ISO
  metadata?: Record<string, string | number | boolean | null>;
}

export interface DatabaseSchema {
  users: Record<string, UserRecord>;
  userSyncData: Record<string, UserSyncPayload>;
  analyticsEvents: AnalyticsEventRecord[];
  meta: {
    version: number;
    createdAt: string;
    lastUpdated: string;
  };
}
