'use client';

import { Auth, onAuthStateChanged, User, signInWithPopup, GoogleAuthProvider, signOut as firebaseSignOut, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { useAuth } from '@/firebase';
import { useState, useEffect } from 'react';

const useUserHook = () => {
    const auth = useAuth();
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (auth) {
            const unsubscribe = onAuthStateChanged(auth, (user) => {
                setUser(user);
                setLoading(false);
            });
            return () => unsubscribe();
        } else {
            // If auth is not ready, we are still loading.
            setLoading(true);
        }
    }, [auth]);

    return { user, loading };
};

export { useUserHook as useUser, firebaseSignOut as signOut, signInWithPopup, GoogleAuthProvider, signInWithEmailAndPassword, createUserWithEmailAndPassword };
