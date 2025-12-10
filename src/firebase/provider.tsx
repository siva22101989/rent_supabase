
'use client';
import {
  createContext,
  useContext,
  useMemo,
  type ReactNode,
} from 'react';

import { type FirebaseApp } from 'firebase/app';
import { type Auth }from 'firebase/auth';
import { type Firestore } from 'firebase/firestore';

export type FirebaseContextValue = {
  auth: Auth | null;
  firestore: Firestore | null;
  firebaseApp: FirebaseApp | null;
};

const FirebaseContext = createContext<FirebaseContextValue | undefined>(
  undefined
);

type FirebaseProviderProps = {
  children: ReactNode;
  value: {
    firebaseApp: FirebaseApp;
    auth: Auth;
    firestore: Firestore;
  };
};

export function FirebaseProvider({ children, value }: FirebaseProviderProps) {
  const memoizedValue = useMemo(
    () => ({
      auth: value.auth,
      firestore: value.firestore,
      firebaseApp: value.firebaseApp,
    }),
    [value.auth, value.firestore, value.firebaseApp]
  );
  return (
    <FirebaseContext.Provider value={memoizedValue}>
      {children}
    </FirebaseContext.Provider>
  );
}

export function useFirebase() {
  const context = useContext(FirebaseContext);
  if (context === undefined) {
    throw new Error('useFirebase must be used within a FirebaseProvider');
  }
  return context;
}

export function useAuth() {
  const context = useFirebase();
  return context.auth;
}

export function useFirestore() {
  const context = useFirebase();
  return context.firestore;
}

export function useFirebaseApp() {
  const context = useFirebase();
  return context.firebaseApp;
}
