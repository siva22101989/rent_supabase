'use client';

import { Auth, onAuthStateChanged, User, signInWithPopup, GoogleAuthProvider, signOut as firebaseSignOut, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { useAuth, useSubscription } from 'reactfire';

const useUserHook = () => {
    const auth = useAuth();
    const { status, data: user } = useSubscription(
        ['user', auth.currentUser?.uid],
        () => {
            return new Promise<User | null>((resolve) => {
                const unsubscribe = onAuthStateChanged(auth, (user) => {
                    resolve(user);
                    unsubscribe();
                });
            });
        },
        { suspense: false }
    );

    return { user: user || null, loading: status === 'loading' };
};

export { useUserHook as useUser, signInWithPopup, GoogleAuthProvider, firebaseSignOut as signOut, signInWithEmailAndPassword, createUserWithEmailAndPassword };
