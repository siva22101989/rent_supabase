'use client';

import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import * as React from 'react';

interface LoadingOverlayProps extends React.HTMLAttributes<HTMLDivElement> {
  isLoading: boolean;
  message?: string;
  fullScreen?: boolean;
}

export function LoadingOverlay({ isLoading, message = 'Processing...', fullScreen = false, className, ...props }: LoadingOverlayProps) {
  if (!isLoading) return null;

  return (
    <div
      className={cn(
        fullScreen ? "fixed inset-0 z-[100]" : "absolute inset-0 z-50",
        "flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm animate-in fade-in duration-200",
        className
      )}
      {...props}
    >
      <Loader2 className="h-10 w-10 animate-spin text-primary" />
      {message && <p className="mt-4 text-sm font-medium text-muted-foreground animate-pulse">{message}</p>}
    </div>
  );
}
