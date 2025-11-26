import * as admin from 'firebase-admin';

// Initialize the Firebase Admin SDK
if (!admin.apps.length) {
  admin.initializeApp({
    // You can pass in the service account credentials here
    // or rely on the GOOGLE_APPLICATION_CREDENTIALS environment variable
  });
}

export const adminDb = admin.firestore();
export const adminAuth = admin.auth();
