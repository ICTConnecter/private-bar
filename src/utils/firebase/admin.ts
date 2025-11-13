import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';

let adminApp: App;
let adminDb: Firestore;

/**
 * Firebase Admin SDKの初期化
 */
export function initializeAdminApp(): App {
  if (getApps().length === 0) {
    // 環境変数から認証情報を取得
    const projectId = process.env.FIRESTORE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n');

    if (!projectId || !clientEmail || !privateKey) {
      throw new Error('Firebase Admin credentials are not set in environment variables');
    }

    adminApp = initializeApp({
      credential: cert({
        projectId,
        clientEmail,
        privateKey,
      }),
    });
  } else {
    adminApp = getApps()[0];
  }

  return adminApp;
}

/**
 * Firebase Admin Firestoreインスタンスの取得
 */
export function getAdminDb(): Firestore {
  if (!adminDb) {
    initializeAdminApp();
    adminDb = getFirestore();
  }
  return adminDb;
}
