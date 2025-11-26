'use client';

import {
  FirebaseAppProvider,
  FirestoreProvider,
  AuthProvider,
} from 'reactfire';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { useFirebase } from './provider';

export const FirebaseClientProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const { firebaseApp, firestore: serverFirestore, auth: serverAuth } = useFirebase();

  // Initialize client-side instances
  const firestore = typeof window !== 'undefined' ? getFirestore(firebaseApp) : serverFirestore;
  const auth = typeof window !== 'undefined' ? getAuth(firebaseApp) : serverAuth;
  
  // No emulators in production.
  // if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  //   connectFirestoreEmulator(firestore, 'localhost', 8080);
  //   connectAuthEmulator(auth, 'http://localhost:9099');
  // }
  
  return (
    <FirebaseAppProvider firebaseApp={firebaseApp}>
      <AuthProvider sdk={auth}>
        <FirestoreProvider sdk={firestore}>
            {children}
        </FirestoreProvider>
      </AuthProvider>
    </FirebaseAppProvider>
  );
};
