'use client';

import { useToast as useShadcnToast } from "@/hooks/use-toast";
import { useCallback } from "react";

/**
 * Unified toast utility to ensure consistent notification patterns across the app.
 * Wraps shadcn's useToast with predefined success/error/info configurations.
 */
export function useUnifiedToast() {
  const { toast } = useShadcnToast();

  const success = useCallback((title: string, description?: string) => {
    toast({
      title,
      description,
      variant: "default",
      className: "bg-emerald-50 border-emerald-200 text-emerald-900",
    });
  }, [toast]);

  const error = useCallback((title: string, description?: string) => {
    toast({
      title,
      description,
      variant: "destructive",
    });
  }, [toast]);

  const info = useCallback((title: string, description?: string) => {
    toast({
      title,
      description,
      variant: "default",
      className: "bg-blue-50 border-blue-200 text-blue-900",
    });
  }, [toast]);

  const warn = useCallback((title: string, description?: string) => {
    toast({
      title,
      description,
      variant: "default",
      className: "bg-amber-50 border-amber-200 text-amber-900",
    });
  }, [toast]);

  return { success, error, info, warn, toast };
}
