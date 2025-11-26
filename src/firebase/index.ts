// This file is a barrel for all things related to Firebase.
// It re-exports hooks, providers, and initialization functions.

import { doc, collection, query, where, orderBy, getDocs, onSnapshot } from 'firebase/firestore';
import { useUser } from './auth/use-user';

// Re-exporting hooks and utilities
export { useUser, doc, collection, query, where, orderBy, getDocs, onSnapshot };

// Re-exporting providers and context hooks
export * from './provider';

// Placeholder for custom hooks.
// In a real app, you would have files like `useCollection.ts` and `useDoc.ts`
// For now, we'll define them here conceptually.

export const useCollection = (query: any) => {
  // Dummy implementation
  return { data: [], loading: true };
};

export const useDoc = (ref: any) => {
  // Dummy implementation
  return { data: null, loading: true };
};
