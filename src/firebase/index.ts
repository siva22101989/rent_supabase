import { getApp, getApps, initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { firebaseConfig } from './config';
import { useCollection, useCollectionData, useDocument, useDocumentData } from 'reactfire';

// Re-exporting hooks from reactfire for convenience
export { useCollection, useCollectionData, useDocument, useDocumentData };

// Re-exporting providers and context hooks
export * from './provider';
export * from './client-provider';

export function initializeFirebase() {
  const apps = getApps();
  const firebaseApp = !apps.length ? initializeApp(firebaseConfig) : getApp();
  const firestore = getFirestore(firebaseApp);
  const auth = getAuth(firebaseApp);

  return { firebaseApp, firestore, auth };
}
