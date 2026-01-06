'use client';

import { useSyncExternalStore } from 'react';
import { WifiOff } from 'lucide-react';

function subscribe(callback: () => void) {
  window.addEventListener('online', callback);
  window.addEventListener('offline', callback);
  return () => {
    window.removeEventListener('online', callback);
    window.removeEventListener('offline', callback);
  };
}

function getSnapshot() {
  return navigator.onLine;
}

export function OfflineIndicator() {
  const isOnline = useSyncExternalStore(subscribe, getSnapshot, () => true);

  if (isOnline) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[9999] animate-in slide-in-from-bottom duration-500">
      <div className="bg-destructive text-destructive-foreground px-4 py-3 rounded-md shadow-lg flex items-center gap-2 font-medium text-sm border border-destructive/20">
        <WifiOff className="h-4 w-4" />
        <span>You are currently offline. Changes may not be saved.</span>
      </div>
    </div>
  );
}
