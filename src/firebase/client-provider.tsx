'use client';

import React from 'react';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { useFirebase, FirebaseProvider } from './provider';

export const FirebaseClientProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const { firebaseApp, firestore: serverFirestore, auth: serverAuth } = useFirebase();

  // These instances are now client-side only
  const firestore = getFirestore(firebaseApp);
  const auth = getAuth(firebaseApp);
  
  return (
    <FirebaseProvider firebaseApp={firebaseApp} auth={auth} firestore={firestore}>
        {children}
    </FirebaseProvider>
  );
};