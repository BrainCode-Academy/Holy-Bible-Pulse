import fs from 'fs';
import path from 'path';
import { FirestoreDatabase } from './firestoreDatabase';
import { DatabaseSchema, UserRecord, UserSyncPayload, AnalyticsEventRecord, UserRole } from './types';

// ============================================================================
// PRODUCTION DATABASE CUTOVER: GOOGLE CLOUD FIRESTORE
// Database ID: ai-studio-holybible-f057e238-76d7-4275-be34-3611297f0f3c
// Collections:
//   - /users/{userId}
//   - /userSyncData/{userId}
//   - /analyticsEvents/{eventId}
//   - /meta/migration
// ============================================================================

export const db = new FirestoreDatabase();

/**
 * Backup / Reference implementation of legacy JSON Database
 * Preserved for offline recovery and audit history.
 */
export class LegacyJSONDatabaseBackup {
  private dataDir = path.join(process.cwd(), 'server', 'data');
  private dbFile = path.join(process.cwd(), 'server', 'data', 'store.json');

  public getBackupData(): DatabaseSchema | null {
    try {
      if (fs.existsSync(this.dbFile)) {
        return JSON.parse(fs.readFileSync(this.dbFile, 'utf-8'));
      }
    } catch (e) {
      console.error('[Backup] Error reading store.json backup:', e);
    }
    return null;
  }
}
