'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AppLayout } from '@/components/layout/app-layout';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error);
  }, [error]);

  return (
    <AppLayout>
      <div className="flex h-[80vh] flex-col items-center justify-center gap-4 text-center">
        <h2 className="text-4xl font-bold text-destructive">Something went wrong!</h2>
        <p className="text-muted-foreground max-w-[500px]">
            {error.message || "An unexpected error occurred. Please try again later."}
        </p>
        <Button onClick={() => reset()} variant="default">
          Try again
        </Button>
      </div>
    </AppLayout>
  );
}
