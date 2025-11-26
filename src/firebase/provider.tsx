'use client';
import { createContext, useContext } from 'react';
import type { FirebaseApp } from 'firebase/app';
import type { Auth } from 'firebase/auth';
import type { Firestore } from 'firebase/firestore';
import { useFirebaseApp, useFirestore, useAuth as useFirebaseAuth } from 'reactfire';

type FirebaseContextValue = {
  firebaseApp: FirebaseApp;
  firestore: Firestore;
  auth: Auth;
};

const FirebaseContext = createContext<FirebaseContextValue | undefined>(
  undefined
);

export const FirebaseProvider = ({
  children,
  ...value
}: React.PropsWithChildren<FirebaseContextValue>) => {
  return (
    <FirebaseContext.Provider value={value}>{children}</FirebaseContext.Provider>
  );
};

export const useFirebase = () => {
  const context = useContext(FirebaseContext);
  if (context === undefined) {
    throw new Error('useFirebase must be used within a FirebaseProvider');
  }
  return context;
};

// These hooks can now be used in client components that are descendants of FirebaseClientProvider
export { useFirebaseApp, useFirestore };

export const useAuth = () => {
    return useFirebaseAuth();
}
