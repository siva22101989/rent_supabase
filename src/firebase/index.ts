import { getApp, getApps, initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, useCollection, useDocument, doc, collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { firebaseConfig } from './config';
import { useUser } from './auth/use-user';

// Re-exporting hooks and utilities
export { useCollection, useDocument, useUser, doc, collection, query, where, orderBy, getDocs };

// Re-exporting providers and context hooks
export * from './provider';
export * from './client-provider';

export function initializeFirebase() {
  const apps = getApps();
  const firebaseApp = !apps.length ? initializeApp(firebaseConfig) : getApp();
  // These are server-side instances
  const firestore = getFirestore(firebaseApp);
  const auth = getAuth(firebaseApp);

  return { firebaseApp, firestore, auth };
}
