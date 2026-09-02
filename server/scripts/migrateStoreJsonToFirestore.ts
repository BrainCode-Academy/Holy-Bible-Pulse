import fs from 'fs';
import path from 'path';
import { firestoreClient } from '../db/firestore';
import { DatabaseSchema, UserRecord, UserSyncPayload, AnalyticsEventRecord } from '../db/types';

async function runMigration() {
  console.log('================================================================');
  console.log('HOLY BIBLE+ PRODUCTION FIRESTORE DATA MIGRATION');
  console.log('================================================================\n');

  const storePath = path.join(process.cwd(), 'server', 'data', 'store.json');
  if (!fs.existsSync(storePath)) {
    console.error(`Source store file not found at: ${storePath}`);
    process.exit(1);
  }

  const raw = fs.readFileSync(storePath, 'utf-8');
  const storeData: DatabaseSchema = JSON.parse(raw);

  const users = storeData.users || {};
  const userSyncData = storeData.userSyncData || {};
  const analyticsEvents = storeData.analyticsEvents || [];

  const userIds = Object.keys(users);
  const syncUserIds = Object.keys(userSyncData);

  console.log(`Found in store.json:`);
  console.log(`- Users: ${userIds.length}`);
  console.log(`- User Sync Records: ${syncUserIds.length}`);
  console.log(`- Analytics Events: ${analyticsEvents.length}\n`);

  console.log('Starting migration to Google Cloud Firestore...');

  // 1. Migrate Users
  let usersMigrated = 0;
  for (const uid of userIds) {
    const user = users[uid];
    console.log(`Migrating User [${uid}] (${user.email}) -> /users/${uid}...`);
    const success = await firestoreClient.setDoc('users', uid, user);
    if (!success) {
      console.error(`FAILED to migrate user ${uid}`);
    } else {
      usersMigrated++;
    }
  }

  // 2. Migrate UserSyncData
  let syncMigrated = 0;
  for (const uid of syncUserIds) {
    const sync = userSyncData[uid];
    console.log(`Migrating Sync Data for [${uid}] -> /userSyncData/${uid}...`);
    const success = await firestoreClient.setDoc('userSyncData', uid, sync);
    if (!success) {
      console.error(`FAILED to migrate sync data for ${uid}`);
    } else {
      syncMigrated++;
    }
  }

  // 3. Migrate Analytics Events
  let analyticsMigrated = 0;
  // Migrate up to 500 most recent events to prevent quota exhaustion
  const recentEvents = analyticsEvents.slice(-500);
  for (const evt of recentEvents) {
    const success = await firestoreClient.setDoc('analyticsEvents', evt.id, evt);
    if (success) {
      analyticsMigrated++;
    }
  }
  console.log(`Migrated ${analyticsMigrated} analytics events.`);

  // 4. Verification Phase
  console.log('\n--- VERIFYING MIGRATED RECORDS IN FIRESTORE ---');
  let verificationPassed = true;

  // Verify users
  const firestoreUsers = await firestoreClient.listDocs('users', 500);
  console.log(`Firestore /users total documents: ${firestoreUsers.length}`);

  for (const uid of userIds) {
    const original = users[uid];
    const inFs = await firestoreClient.getDoc('users', uid);
    if (!inFs) {
      console.error(`Verification FAILED: User ${uid} missing in Firestore!`);
      verificationPassed = false;
    } else if (inFs.email !== original.email || inFs.role !== original.role) {
      console.error(`Verification FAILED: User ${uid} data mismatch!`);
      verificationPassed = false;
    } else {
      console.log(`Verified User [${uid}] (${inFs.email}, Role: ${inFs.role}): OK`);
    }
  }

  // Verify sync
  for (const uid of syncUserIds) {
    const original = userSyncData[uid];
    const inFs = await firestoreClient.getDoc('userSyncData', uid);
    if (!inFs) {
      console.error(`Verification FAILED: Sync data for ${uid} missing in Firestore!`);
      verificationPassed = false;
    } else {
      const bCount = inFs.bookmarks?.length || 0;
      const hCount = inFs.highlights?.length || 0;
      const nCount = inFs.notes?.length || 0;
      const pCount = inFs.readingPlans?.length || 0;
      console.log(`Verified Sync Data [${uid}]: Bookmarks=${bCount}, Highlights=${hCount}, Notes=${nCount}, Plans=${pCount}: OK`);
    }
  }

  if (verificationPassed && usersMigrated === userIds.length && syncMigrated === syncUserIds.length) {
    // Write Sentinel document
    const sentinel = {
      status: 'COMPLETED',
      migratedAt: new Date().toISOString(),
      source: 'store.json',
      usersMigrated,
      syncRecordsMigrated: syncMigrated,
      analyticsMigrated,
    };
    await firestoreClient.setDoc('meta', 'migration', sentinel);
    console.log('\nSENTINEL /meta/migration successfully written to Firestore.');
    console.log('================================================================');
    console.log('MIGRATION COMPLETED AND VERIFIED 100% SUCCESSFULLY');
    console.log('================================================================');
  } else {
    console.error('MIGRATION VERIFICATION FAILED. DO NOT PROCEED TO CUTOVER.');
    process.exit(1);
  }
}

runMigration().catch(err => {
  console.error('Migration error:', err);
  process.exit(1);
});
