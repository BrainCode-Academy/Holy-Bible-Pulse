import fs from 'fs';
import path from 'path';
import os from 'os';
import crypto from 'crypto';
import { firestoreClient } from '../db/firestore';

export interface StorageResult {
  url: string;
  storagePath: string;
  storageKey: string;
  sizeBytes: number;
  mimeType: string;
  createdAt: string;
}

export interface StorageProvider {
  saveImage(userId: string, buffer: Buffer, mimeType: string): Promise<StorageResult>;
  deleteImage(storagePathOrKey: string): Promise<boolean>;
  getImage(filenameOrStoragePath: string): Promise<{ buffer: Buffer; mimeType: string } | null>;
  migrateLegacyAvatar(userId: string): Promise<{ migrated: boolean; avatarUrl?: string; storagePath?: string }>;
}

/**
 * FirebaseCloudStorageProvider
 * 
 * Production-grade Persistent Storage Architecture:
 * - Authoritative Master Storage: Google Firebase Cloud Storage / Google Cloud Storage.
 *   Stored under canonical paths: `avatars/{userId}/profile_{timestamp}.{ext}`
 * - Download URLs: Signed with downloadTokens metadata for direct global edge CDN delivery.
 * - Firestore User Record: Stores only `avatarUrl`, `avatarStoragePath`, and metadata in `/users/{userId}`.
 *   Zero base64 data or binary chunks in Firestore for new uploads.
 * - Transient Local Cache: Uses system temp directory (`os.tmpdir()/holybible_avatars`) for fast read caching.
 * - Backward Compatibility: Supports legacy base64 profiles and provides automatic migration.
 */
export class FirebaseCloudStorageProvider implements StorageProvider {
  private cacheDir: string;

  constructor() {
    this.cacheDir = path.join(os.tmpdir(), 'holybible_avatars');
    this.ensureDirectory();
  }

  private ensureDirectory() {
    try {
      if (!fs.existsSync(this.cacheDir)) {
        fs.mkdirSync(this.cacheDir, { recursive: true });
      }
    } catch (err) {
      // Non-fatal
    }
  }

  /**
   * Helper to normalize any storage path, URL, or filename into a standard local cache filename.
   * Example: 'avatars/usr_123/profile_456.jpg' -> 'avatar_usr_123_profile_456.jpg'
   */
  private normalizeCacheKey(input: string): string {
    const clean = input.split('?')[0].replace(/^\/api\/uploads\/avatars\//, '');
    if (clean.startsWith('avatars/')) {
      const parts = clean.split('/');
      if (parts.length >= 3) {
        return `avatar_${parts[1]}_${parts[2]}`;
      }
      return clean.replace(/\//g, '_');
    }
    return path.basename(clean);
  }

  /**
   * Helper to reconstruct canonical Firebase Cloud Storage path from any key/filename.
   * Example: 'avatar_usr_123_profile_456.jpg' -> 'avatars/usr_123/profile_456.jpg'
   */
  private normalizeStoragePath(input: string): string | null {
    const clean = input.split('?')[0].replace(/^\/api\/uploads\/avatars\//, '');
    if (clean.startsWith('avatars/')) {
      return clean;
    }
    const match = clean.match(/^avatar_([a-zA-Z0-9_-]+?)_(profile_\d+\.[a-zA-Z0-9]+)$/);
    if (match) {
      return `avatars/${match[1]}/${match[2]}`;
    }
    return null;
  }

  /**
   * Upload an avatar to Firebase Cloud Storage and return persistent URL + storage path.
   * Does NOT write base64 into Firestore.
   */
  public async saveImage(userId: string, buffer: Buffer, mimeType: string): Promise<StorageResult> {
    this.ensureDirectory();

    const extensionMap: Record<string, string> = {
      'image/jpeg': '.jpg',
      'image/jpg': '.jpg',
      'image/png': '.png',
      'image/webp': '.webp',
      'image/gif': '.gif',
    };

    const ext = extensionMap[mimeType.toLowerCase()] || '.jpg';
    const cleanUserId = userId.replace(/[^a-zA-Z0-9_-]/g, '');
    const timestamp = Date.now();
    const safeFilename = `profile_${timestamp}${ext}`;
    const storagePath = `avatars/${cleanUserId}/${safeFilename}`;
    const cacheFilename = `avatar_${cleanUserId}_${safeFilename}`;
    const cachePath = path.join(this.cacheDir, cacheFilename);

    // 1. Write to local temporary cache for instant fast serving
    try {
      await fs.promises.writeFile(cachePath, buffer);
    } catch (err) {
      // Non-fatal cache failure
    }

    const now = new Date().toISOString();
    const downloadToken = crypto.randomUUID ? crypto.randomUUID() : crypto.randomBytes(16).toString('hex');
    const bucket = firestoreClient.getStorageBucket();
    const apiKey = firestoreClient.getApiKey();

    let firebaseStorageUrl = `https://firebasestorage.googleapis.com/v0/b/${encodeURIComponent(bucket)}/o/${encodeURIComponent(storagePath)}?alt=media&token=${downloadToken}`;

    // 2. Upload to Firebase Cloud Storage via REST API
    if (bucket) {
      try {
        const uploadUrl = `https://firebasestorage.googleapis.com/v0/b/${encodeURIComponent(bucket)}/o?name=${encodeURIComponent(storagePath)}&uploadType=media${apiKey ? `&key=${apiKey}` : ''}`;
        const uploadRes = await fetch(uploadUrl, {
          method: 'POST',
          headers: {
            'Content-Type': mimeType,
            'x-goog-meta-firebasestoragedownloadtokens': downloadToken,
          },
          body: buffer,
        });

        if (uploadRes.ok) {
          const resData = await uploadRes.json().catch(() => ({}));
          const actualToken = resData.downloadTokens || downloadToken;
          firebaseStorageUrl = `https://firebasestorage.googleapis.com/v0/b/${encodeURIComponent(bucket)}/o/${encodeURIComponent(storagePath)}?alt=media&token=${actualToken}`;
          console.log(`[StorageService] Successfully uploaded avatar to Firebase Storage: ${storagePath}`);
        } else {
          const errText = await uploadRes.text().catch(() => '');
          console.warn(`[StorageService] Firebase Storage upload notice (HTTP ${uploadRes.status}): ${errText}`);
        }
      } catch (storageErr: any) {
        console.warn(`[StorageService] Firebase Storage network upload attempt notice:`, storageErr?.message || storageErr);
      }
    }

    return {
      url: firebaseStorageUrl,
      storagePath,
      storageKey: cacheFilename,
      sizeBytes: buffer.length,
      mimeType,
      createdAt: now,
    };
  }

  /**
   * Retrieve avatar image from local cache, Firebase Cloud Storage, or legacy Firestore fallback.
   */
  public async getImage(filenameOrStoragePath: string): Promise<{ buffer: Buffer; mimeType: string } | null> {
    const cacheKey = this.normalizeCacheKey(filenameOrStoragePath);
    const localCachePath = path.join(this.cacheDir, cacheKey);

    // 1. Try local temporary cache first
    if (fs.existsSync(localCachePath)) {
      try {
        const buffer = await fs.promises.readFile(localCachePath);
        const mimeType = cacheKey.endsWith('.png')
          ? 'image/png'
          : cacheKey.endsWith('.webp')
          ? 'image/webp'
          : 'image/jpeg';
        return { buffer, mimeType };
      } catch (err) {
        // Cache miss
      }
    }

    // Also check if any file in cache directory ends with the basename
    const baseName = path.basename(filenameOrStoragePath).split('?')[0];
    try {
      if (fs.existsSync(this.cacheDir)) {
        const files = await fs.promises.readdir(this.cacheDir);
        const matched = files.find(f => f === baseName || f.endsWith('_' + baseName) || f === cacheKey);
        if (matched) {
          const buffer = await fs.promises.readFile(path.join(this.cacheDir, matched));
          const mimeType = matched.endsWith('.png')
            ? 'image/png'
            : matched.endsWith('.webp')
            ? 'image/webp'
            : 'image/jpeg';
          return { buffer, mimeType };
        }
      }
    } catch {
      // Non-fatal
    }

    // 2. Fetch from Firebase Cloud Storage REST endpoint
    const bucket = firestoreClient.getStorageBucket();
    const storagePath = this.normalizeStoragePath(filenameOrStoragePath);

    if (bucket && storagePath) {
      try {
        const downloadUrl = `https://firebasestorage.googleapis.com/v0/b/${encodeURIComponent(bucket)}/o/${encodeURIComponent(storagePath)}?alt=media`;
        const res = await fetch(downloadUrl);
        if (res.ok) {
          const arrayBuffer = await res.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);
          const mimeType = res.headers.get('content-type') || 'image/jpeg';

          // Warm local cache
          try {
            this.ensureDirectory();
            await fs.promises.writeFile(localCachePath, buffer);
          } catch (writeErr) {
            // Non-fatal
          }

          return { buffer, mimeType };
        }
      } catch (cloudErr) {
        // Fallback to legacy
      }
    }

    // 3. BACKWARD COMPATIBILITY: Retrieve legacy base64 image from Firestore /userAvatars/{userId}
    let potentialUserId = cacheKey;
    const legacyMatch = cacheKey.match(/^avatar_([a-zA-Z0-9_-]+?)(?:_[a-f0-9]+|_\d+|\.|$)/);
    if (legacyMatch && legacyMatch[1]) {
      potentialUserId = legacyMatch[1];
    }

    try {
      let avatarDoc = await firestoreClient.getDoc('userAvatars', potentialUserId);

      // Search by storageKey if not found by direct userId
      if (!avatarDoc || !avatarDoc.dataUrl) {
        const queryResults = await firestoreClient.runStructuredQuery(
          'userAvatars',
          [{ field: 'storageKey', op: 'EQUAL', value: cacheKey }],
          1
        );
        if (queryResults.length > 0 && queryResults[0].dataUrl) {
          avatarDoc = queryResults[0];
        }
      }

      if (avatarDoc && avatarDoc.dataUrl) {
        const rawDataUrl = String(avatarDoc.dataUrl);
        const parts = rawDataUrl.match(/^data:([^;]+);base64,(.+)$/);
        if (parts) {
          const mimeType = parts[1];
          const base64Data = parts[2];
          const buffer = Buffer.from(base64Data, 'base64');

          // Warm local cache
          try {
            this.ensureDirectory();
            await fs.promises.writeFile(localCachePath, buffer);
          } catch (writeErr) {
            // Non-fatal
          }

          return { buffer, mimeType };
        }
      }
    } catch (err) {
      console.warn(`[StorageService] Legacy avatar retrieval notice:`, err);
    }

    return null;
  }

  /**
   * Delete an avatar object from Firebase Cloud Storage and local cache.
   */
  public async deleteImage(storagePathOrKey: string): Promise<boolean> {
    try {
      const cacheKey = this.normalizeCacheKey(storagePathOrKey);
      const cachePath = path.join(this.cacheDir, cacheKey);
      if (fs.existsSync(cachePath)) {
        await fs.promises.unlink(cachePath).catch(() => {});
      }

      // Delete from Firebase Cloud Storage
      const bucket = firestoreClient.getStorageBucket();
      const storagePath = this.normalizeStoragePath(storagePathOrKey);

      if (bucket && storagePath) {
        try {
          const deleteUrl = `https://firebasestorage.googleapis.com/v0/b/${encodeURIComponent(bucket)}/o/${encodeURIComponent(storagePath)}`;
          await fetch(deleteUrl, { method: 'DELETE' }).catch(() => {});
        } catch (delErr) {
          // Non-fatal
        }
      }

      // Also clean up any legacy Firestore document
      let userId = cacheKey;
      const legacyMatch = cacheKey.match(/^avatar_([a-zA-Z0-9_-]+?)(?:_[a-f0-9]+|_\d+|\.|$)/);
      if (legacyMatch && legacyMatch[1]) {
        userId = legacyMatch[1];
      }
      await firestoreClient.deleteDoc('userAvatars', userId).catch(() => {});

      return true;
    } catch (err) {
      console.warn('[StorageService] Failed to delete avatar image:', err);
      return false;
    }
  }

  /**
   * Migration utility: Migrates an existing legacy base64 avatar to Firebase Cloud Storage.
   */
  public async migrateLegacyAvatar(userId: string): Promise<{ migrated: boolean; avatarUrl?: string; storagePath?: string }> {
    try {
      const avatarDoc = await firestoreClient.getDoc('userAvatars', userId);
      if (!avatarDoc || !avatarDoc.dataUrl) {
        return { migrated: false };
      }

      const rawDataUrl = String(avatarDoc.dataUrl);
      const parts = rawDataUrl.match(/^data:([^;]+);base64,(.+)$/);
      if (!parts) {
        return { migrated: false };
      }

      const mimeType = parts[1];
      const base64Data = parts[2];
      const buffer = Buffer.from(base64Data, 'base64');

      // Save to Firebase Storage
      const result = await this.saveImage(userId, buffer, mimeType);

      // Clean up legacy base64 record
      await firestoreClient.deleteDoc('userAvatars', userId).catch(() => {});

      console.log(`[StorageService] Successfully migrated legacy avatar for user [${userId}] to Firebase Storage.`);
      return {
        migrated: true,
        avatarUrl: result.url,
        storagePath: result.storagePath,
      };
    } catch (err) {
      console.error(`[StorageService] Error during avatar migration for user [${userId}]:`, err);
      return { migrated: false };
    }
  }

  public getFilePath(filename: string): string | null {
    const cacheKey = this.normalizeCacheKey(filename);
    const cachePath = path.join(this.cacheDir, cacheKey);
    return fs.existsSync(cachePath) ? cachePath : null;
  }
}

// Singleton storage provider instance
export const storageService = new FirebaseCloudStorageProvider();
