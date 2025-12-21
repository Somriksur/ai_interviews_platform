#!/usr/bin/env tsx

/**
 * Test Firebase Admin SDK Connection
 * 
 * This script helps you verify that your Firebase Admin SDK is properly configured.
 * Run with: npx tsx scripts/test-firebase-connection.ts
 */

// Load environment variables from .env.local
import { config } from 'dotenv';
import { resolve } from 'path';

// Load .env.local file FIRST
config({ path: resolve(process.cwd(), '.env.local') });

// Now import Firebase after env vars are loaded
import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

async function testFirebaseConnection() {
    console.log('🔥 Testing Firebase Admin SDK Connection...\n');

    console.log('🔍 Environment Variables Check:');
    console.log(`   FIREBASE_PROJECT_ID: ${process.env.FIREBASE_PROJECT_ID ? '✅ Set' : '❌ Missing'}`);
    console.log(`   FIREBASE_CLIENT_EMAIL: ${process.env.FIREBASE_CLIENT_EMAIL ? '✅ Set' : '❌ Missing'}`);
    console.log(`   FIREBASE_PRIVATE_KEY: ${process.env.FIREBASE_PRIVATE_KEY ? '✅ Set' : '❌ Missing'}`);
    
    if (process.env.FIREBASE_PRIVATE_KEY?.includes('YOUR_ACTUAL_PRIVATE_KEY_CONTENT_HERE')) {
        console.log('   ⚠️  Private key is still placeholder - replace with actual key');
        return;
    }

    console.log('\n🔧 Initializing Firebase Admin SDK...');

    try {
        const apps = getApps();
        
        if (!apps.length) {
            const projectId = process.env.FIREBASE_PROJECT_ID;
            const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
            const privateKey = process.env.FIREBASE_PRIVATE_KEY;

            if (!projectId || !clientEmail || !privateKey) {
                throw new Error('Missing required environment variables');
            }

            // Clean and format the private key
            let cleanPrivateKey = privateKey;
            
            // Remove quotes if present
            if (cleanPrivateKey.startsWith('"') && cleanPrivateKey.endsWith('"')) {
                cleanPrivateKey = cleanPrivateKey.slice(1, -1);
            }
            
            // Replace escaped newlines with actual newlines
            cleanPrivateKey = cleanPrivateKey.replace(/\\n/g, '\n');

            initializeApp({
                credential: cert({
                    projectId,
                    clientEmail,
                    privateKey: cleanPrivateKey,
                }),
            });

            console.log('✅ Firebase Admin SDK initialized successfully');
        }

        const auth = getAuth();
        const db = getFirestore();

        // Test Firebase Auth
        console.log('\n🔐 Testing Firebase Auth...');
        try {
            const userList = await auth.listUsers(1);
            console.log('✅ Firebase Auth: Connected successfully');
            console.log(`   Found ${userList.users.length} user(s) in the first page`);
        } catch (error) {
            console.log('❌ Firebase Auth: Connection failed');
            console.log(`   Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }

        // Test Firestore
        console.log('\n🗄️  Testing Firestore...');
        try {
            const testCollection = db.collection('users');
            const snapshot = await testCollection.limit(1).get();
            console.log('✅ Firestore: Connected successfully');
            console.log(`   Users collection has ${snapshot.size} document(s)`);
        } catch (error) {
            console.log('❌ Firestore: Connection failed');
            console.log(`   Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }

        console.log('\n🎉 Firebase Admin SDK test completed!');

    } catch (error) {
        console.log('❌ Failed to initialize Firebase Admin SDK');
        console.log(`   Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        
        console.log('\n📝 Troubleshooting:');
        console.log('   1. Verify your private key is complete and properly formatted');
        console.log('   2. Check that your service account has the correct permissions');
        console.log('   3. Ensure your Firebase project ID is correct');
    }
}

// Run the test
testFirebaseConnection().catch(console.error);