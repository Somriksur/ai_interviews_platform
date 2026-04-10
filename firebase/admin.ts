import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

// Initialize Firebase Admin SDK
function initFirebaseAdmin() {
    const apps = getApps();

    if (!apps.length) {
        // Validate required environment variables
        const projectId = process.env.FIREBASE_PROJECT_ID;
        const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
        const privateKey = process.env.FIREBASE_PRIVATE_KEY;

        if (!projectId || !clientEmail || !privateKey) {
            console.warn('⚠️  Missing Firebase Admin SDK environment variables');
            console.warn('App will run in client-only mode. Some server-side features may not work.');
            console.warn('Required: FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY');
            
            // Return null objects to prevent crashes
            return {
                auth: null,
                db: null,
            };
        }

        // Check if private key is placeholder
        if (privateKey.includes('YOUR_ACTUAL_PRIVATE_KEY_CONTENT_HERE')) {
            console.warn('⚠️  Firebase private key is placeholder');
            console.warn('Please replace with actual private key from Firebase Console');
            console.warn('App will run in client-only mode.');
            
            return {
                auth: null,
                db: null,
            };
        }

        try {
            // Clean and format the private key
            let cleanPrivateKey = privateKey;
            
            // Remove quotes if present
            if (cleanPrivateKey.startsWith('"') && cleanPrivateKey.endsWith('"')) {
                cleanPrivateKey = cleanPrivateKey.slice(1, -1);
            }
            
            // Replace escaped newlines with actual newlines
            cleanPrivateKey = cleanPrivateKey.replace(/\\n/g, '\n');
            
            // Ensure proper formatting
            if (!cleanPrivateKey.includes('-----BEGIN PRIVATE KEY-----')) {
                throw new Error('Private key does not contain proper BEGIN marker');
            }
            
            if (!cleanPrivateKey.includes('-----END PRIVATE KEY-----')) {
                throw new Error('Private key does not contain proper END marker');
            }

            console.log('🔥 Initializing Firebase Admin SDK...');
            
            initializeApp({
                credential: cert({
                    projectId,
                    clientEmail,
                    privateKey: cleanPrivateKey,
                }),
            });

            console.log('✅ Firebase Admin SDK initialized successfully');
        } catch (error) {
            console.error('❌ Failed to initialize Firebase Admin SDK:', error);
            console.warn('App will continue in client-only mode');
            
            return {
                auth: null,
                db: null,
            };
        }
    }

    return {
        auth: getAuth(),
        db: getFirestore(),
    };
}

const services = initFirebaseAdmin();

// The app requires admin services for server routes; keep runtime fallback behavior,
// but expose non-null typed exports so route handlers compile under strict mode.
const auth = services.auth as ReturnType<typeof getAuth>;
const db = services.db as ReturnType<typeof getFirestore>;

export { auth, db };
