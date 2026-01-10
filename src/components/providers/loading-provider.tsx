'use client';

import * as React from 'react';
import { LoadingOverlay } from '@/components/ui/loading-overlay';

interface LoadingContextType {
  isLoading: boolean;
  showLoading: (message?: string) => void;
  hideLoading: () => void;
}

const LoadingContext = React.createContext<LoadingContextType | undefined>(undefined);

import { usePathname, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

// Separate component to handle route changes, wrapped in Suspense to avoid de-opting entire app
function RouteChangeListener() {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const { hideLoading } = useLoading();

    React.useEffect(() => {
        hideLoading();
    }, [pathname, searchParams, hideLoading]);

    return null;
}

export function LoadingProvider({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = React.useState(false);
  const [message, setMessage] = React.useState<string | undefined>(undefined);

  const showLoading = React.useCallback((msg?: string) => {
    setMessage(msg);
    setIsLoading(true);
  }, []);

  const hideLoading = React.useCallback(() => {
    setIsLoading(false);
    setMessage(undefined);
  }, []);

  return (
    <LoadingContext.Provider value={{ isLoading, showLoading, hideLoading }}>
      {children}
      <Suspense fallback={null}>
          <RouteChangeListener />
      </Suspense>
      {/* Global Overlay */}
      <LoadingOverlay isLoading={isLoading} message={message} fullScreen />
    </LoadingContext.Provider>
  );
}

export function useLoading() {
  const context = React.useContext(LoadingContext);
  if (context === undefined) {
    throw new Error('useLoading must be used within a LoadingProvider');
  }
  return context;
}
