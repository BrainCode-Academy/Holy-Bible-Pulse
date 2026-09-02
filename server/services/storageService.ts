import fs from 'fs';
import path from 'path';
import os from 'os';
import crypto from 'crypto';
import { firestoreClient } from '../db/firestore';

export interface StorageResult {
  url: string;
  storageKey: string;
  sizeBytes: number;
  mimeType: string;
  createdAt: string;
}

export interface StorageProvider {
  saveImage(userId: string, buffer: Buffer, mimeType: string): Promise<StorageResult>;
  deleteImage(storageKeyOrUserId: string): Promise<boolean>;
  getImage(filenameOrUserId: string): Promise<{ buffer: Buffer; mimeType: string } | null>;
}

/**
 * CloudPersistentStorageProvider
 * 
 * Persistent Storage Architecture:
 * - Authoritative Master Storage: Google Cloud Firestore collection (`/userAvatars/{userId}`) + Google Firebase Cloud Storage.
 * - Transient Local Cache: Uses system temp directory (`os.tmpdir()/holybible_avatars`) which is writable across all environments.
 * - Persistent across serverless lifecycles, redeployments, and cold starts.
 */
export class CloudPersistentStorageProvider implements StorageProvider {
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
    const randomSuffix = crypto.randomBytes(8).toString('hex');
    const safeFilename = `avatar_${cleanUserId}_${randomSuffix}${ext}`;
    const cachePath = path.join(this.cacheDir, safeFilename);

    // 1. Write to local temporary cache
    try {
      await fs.promises.writeFile(cachePath, buffer);
    } catch (err) {
      // Non-fatal cache failure
    }

    const now = new Date().toISOString();
    const dataUrl = `data:${mimeType};base64,${buffer.toString('base64')}`;
    let firebaseStorageUrl: string | null = null;

    // 2. Upload to Firebase Cloud Storage via REST API
    const bucket = firestoreClient.getStorageBucket();
    const apiKey = firestoreClient.getApiKey();
    if (bucket && apiKey) {
      try {
        const uploadUrl = `https://firebasestorage.googleapis.com/v0/b/${encodeURIComponent(bucket)}/o?name=${encodeURIComponent('avatars/' + safeFilename)}&uploadType=media&key=${apiKey}`;
        const uploadRes = await fetch(uploadUrl, {
          method: 'POST',
          headers: { 'Content-Type': mimeType },
          body: buffer,
        });

        if (uploadRes.ok) {
          firebaseStorageUrl = `https://firebasestorage.googleapis.com/v0/b/${encodeURIComponent(bucket)}/o/${encodeURIComponent('avatars/' + safeFilename)}?alt=media`;
          console.log(`[StorageProvider] Uploaded avatar to Firebase Storage: ${firebaseStorageUrl}`);
        } else {
          const errText = await uploadRes.text();
          console.warn(`[StorageProvider] Firebase Storage upload notice (${uploadRes.status}):`, errText);
        }
      } catch (storageErr) {
        console.warn('[StorageProvider] Firebase Storage network attempt:', storageErr);
      }
    }

    // 3. Persist permanently to Google Cloud Firestore (/userAvatars/{userId})
    try {
      await firestoreClient.setDoc('userAvatars', userId, {
        userId,
        storageKey: safeFilename,
        dataUrl,
        firebaseStorageUrl,
        mimeType,
        sizeBytes: buffer.length,
        updatedAt: now,
      });
      console.log(`[StorageProvider] Stored avatar record in Firestore for user [${userId}] (${buffer.length} bytes).`);
    } catch (err) {
      console.error(`[StorageProvider] Error writing avatar to Cloud Firestore for user [${userId}]:`, err);
    }

    const publicUrl = `/api/uploads/avatars/${safeFilename}`;

    return {
      url: publicUrl,
      storageKey: safeFilename,
      sizeBytes: buffer.length,
      mimeType,
      createdAt: now,
    };
  }

  public async getImage(filenameOrUserId: string): Promise<{ buffer: Buffer; mimeType: string } | null> {
    const cleanParam = path.basename(filenameOrUserId).split('?')[0];

    // 1. Try local temporary cache first
    const localCachePath = path.join(this.cacheDir, cleanParam);
    if (fs.existsSync(localCachePath)) {
      try {
        const buffer = await fs.promises.readFile(localCachePath);
        const mimeType = cleanParam.endsWith('.png')
          ? 'image/png'
          : cleanParam.endsWith('.webp')
          ? 'image/webp'
          : 'image/jpeg';
        return { buffer, mimeType };
      } catch (err) {
        // Cache miss
      }
    }

    // 2. Extract potential userId from filename (e.g. avatar_usr_123_abc.jpg -> usr_123)
    let potentialUserId = cleanParam;
    const match = cleanParam.match(/^avatar_([a-zA-Z0-9_-]+?)_[a-f0-9]+(?:\.[a-zA-Z0-9]+)?$/);
    if (match && match[1]) {
      potentialUserId = match[1];
    }

    // 3. Retrieve authoritative image from Google Cloud Firestore
    try {
      let avatarDoc = await firestoreClient.getDoc('userAvatars', potentialUserId);

      // If not found by direct ID, search by storageKey
      if (!avatarDoc || !avatarDoc.dataUrl) {
        const queryResults = await firestoreClient.runStructuredQuery(
          'userAvatars',
          [{ field: 'storageKey', op: 'EQUAL', value: cleanParam }],
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

          // Warm local cache for subsequent calls
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
      console.error(`[StorageProvider] Error recovering cloud avatar from Firestore:`, err);
    }

    return null;
  }

  public async deleteImage(storageKeyOrUserId: string): Promise<boolean> {
    try {
      const cleanKey = path.basename(storageKeyOrUserId).split('?')[0];

      // Remove from temporary cache
      const cachePath = path.join(this.cacheDir, cleanKey);
      if (fs.existsSync(cachePath)) {
        await fs.promises.unlink(cachePath).catch(() => {});
      }

      // Remove from Cloud Firestore
      let userId = cleanKey;
      const match = cleanKey.match(/^avatar_([a-zA-Z0-9_-]+?)_[a-f0-9]+/);
      if (match && match[1]) {
        userId = match[1];
      }

      await firestoreClient.deleteDoc('userAvatars', userId);
      return true;
    } catch (err) {
      console.warn('[StorageProvider] Failed to delete image:', err);
      return false;
    }
  }

  public getFilePath(filename: string): string | null {
    const cleanFilename = path.basename(filename).split('?')[0];
    const cachePath = path.join(this.cacheDir, cleanFilename);
    return fs.existsSync(cachePath) ? cachePath : null;
  }
}

// Singleton storage provider instance
export const storageService = new CloudPersistentStorageProvider();
