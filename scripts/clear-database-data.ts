/**
 * Database Data Cleanup Script
 * 
 * This script clears all data from Firestore collections while preserving your codebase.
 * It only deletes documents from collections, not your code files.
 * 
 * Collections that will be cleared:
 * - students
 * - organizations
 * - colleges
 * - users
 * - interview-drives
 * - interview-sessions
 * - job-profiles
 * - job-postings
 * - notifications
 * - messages
 * - student-selections
 * - evaluation-reports
 * 
 * Usage: npx tsx scripts/clear-database-data.ts
 */

import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import * as fs from 'fs';
import * as path from 'path';

// Load environment variables from .env.local
function loadEnvFile() {
  const envPath = path.join(process.cwd(), '.env.local');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    envContent.split('\n').forEach(line => {
      const match = line.match(/^([^=:#]+)=(.*)$/);
      if (match) {
        const key = match[1].trim();
        const value = match[2].trim();
        if (!process.env[key]) {
          process.env[key] = value;
        }
      }
    });
  }
}

loadEnvFile();

// Initialize Firebase Admin
if (getApps().length === 0) {
  initializeApp({
    credential: cert({
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

const db = getFirestore();

// Collections to clear
const COLLECTIONS_TO_CLEAR = [
  'students',
  'organizations',
  'colleges',
  'users',
  'interview-drives',
  'interview-sessions',
  'job-profiles',
  'job-postings',
  'notifications',
  'messages',
  'student-selections',
  'evaluation-reports',
  'drive-notifications',
  'job-notifications',
  'college-notifications',
];

async function deleteCollection(collectionName: string, batchSize: number = 100): Promise<number> {
  const collectionRef = db.collection(collectionName);
  const query = collectionRef.limit(batchSize);

  return new Promise((resolve, reject) => {
    deleteQueryBatch(query, resolve, reject, 0);
  });
}

async function deleteQueryBatch(
  query: FirebaseFirestore.Query,
  resolve: (value: number) => void,
  reject: (reason?: any) => void,
  deletedCount: number
) {
  try {
    const snapshot = await query.get();

    if (snapshot.size === 0) {
      resolve(deletedCount);
      return;
    }

    const batch = db.batch();
    snapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });

    await batch.commit();
    const newDeletedCount = deletedCount + snapshot.size;

    // Recurse on the next process tick to avoid blocking
    process.nextTick(() => {
      deleteQueryBatch(query, resolve, reject, newDeletedCount);
    });
  } catch (error) {
    reject(error);
  }
}

async function clearAllData() {
  console.log('🚀 Starting database cleanup...\n');
  console.log('⚠️  WARNING: This will delete ALL data from the following collections:');
  console.log(COLLECTIONS_TO_CLEAR.map(c => `   - ${c}`).join('\n'));
  console.log('\n⏳ Starting in 3 seconds... Press Ctrl+C to cancel\n');

  // Wait 3 seconds to allow cancellation
  await new Promise(resolve => setTimeout(resolve, 3000));

  let totalDeleted = 0;

  for (const collectionName of COLLECTIONS_TO_CLEAR) {
    try {
      console.log(`🗑️  Clearing collection: ${collectionName}...`);
      const deletedCount = await deleteCollection(collectionName);
      totalDeleted += deletedCount;
      console.log(`✅ Deleted ${deletedCount} documents from ${collectionName}`);
    } catch (error) {
      console.error(`❌ Error clearing ${collectionName}:`, error);
    }
  }

  console.log(`\n✨ Database cleanup complete!`);
  console.log(`📊 Total documents deleted: ${totalDeleted}`);
  console.log(`\n✅ Your codebase is intact - only data was removed.`);
  console.log(`🎯 You can now start fresh with new data!\n`);
}

// Run the cleanup
clearAllData()
  .then(() => {
    console.log('✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
