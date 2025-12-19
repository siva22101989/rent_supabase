'use client';


import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="flex h-screen w-full flex-col items-center justify-center gap-4 bg-background text-foreground">
          <h2 className="text-4xl font-bold text-destructive">System Error</h2>
          <p className="text-muted-foreground">
            A critical error occurred. We apologize for the inconvenience.
          </p>
          <Button onClick={() => reset()} variant="default">
            Reload Application
          </Button>
        </div>
      </body>
    </html>
  );
}
