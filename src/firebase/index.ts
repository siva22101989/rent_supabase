'use client';
import {
  doc,
  collection,
  query,
  where,
  orderBy,
  getDocs,
  onSnapshot,
  DocumentData,
  Query,
  DocumentReference,
} from 'firebase/firestore';
import { useUser } from './auth/use-user';
import { useState, useEffect, useMemo } from 'react';

export { useUser, doc, collection, query, where, orderBy, getDocs, onSnapshot };

export * from './provider';

export function useCollection<T>(q: Query<DocumentData> | null) {
  const [data, setData] = useState<T[] | null>(null);
  const [loading, setLoading] = useState(true);

  const memoizedQuery = useMemo(() => q, [q ? JSON.stringify(q) : null]);

  useEffect(() => {
    if (!memoizedQuery) {
      setData([]);
      setLoading(false);
      return;
    };
    
    setLoading(true);
    const unsubscribe = onSnapshot(memoizedQuery, snapshot => {
      const docs = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })) as T[];
      setData(docs);
      setLoading(false);
    }, (error) => {
        console.error("Error fetching collection:", error);
        setData([]);
        setLoading(false);
    });

    return () => unsubscribe();
  }, [memoizedQuery]);

  return { data, loading };
}

export function useDoc<T>(ref: DocumentReference<DocumentData> | null) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);

  const memoizedRef = useMemo(() => ref, [ref?.path]);

  useEffect(() => {
    if (!memoizedRef) {
        setData(null);
        setLoading(false);
        return;
    }

    setLoading(true);
    const unsubscribe = onSnapshot(memoizedRef, doc => {
      if (doc.exists()) {
        setData({ ...doc.data(), id: doc.id } as T);
      } else {
        setData(null);
      }
      setLoading(false);
    }, (error) => {
        console.error("Error fetching document:", error);
        setData(null);
        setLoading(false);
    });

    return () => unsubscribe();
  }, [memoizedRef]);

  return { data, loading };
}
