import * as Sentry from '@sentry/nextjs';

/**
 * Centralized error logging utility
 * Use this instead of console.error in production code
 */

export function logError(
  error: unknown,
  context?: {
    operation?: string;
    userId?: string;
    warehouseId?: string;
    metadata?: Record<string, any>;
  }
) {
  const errorMessage = error instanceof Error ? error.message : String(error);
  
  Sentry.captureException(error, {
    tags: {
      operation: context?.operation,
    },
    user: context?.userId ? { id: context.userId } : undefined,
    extra: {
      warehouseId: context?.warehouseId,
      ...context?.metadata,
    },
  });

  // Also log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.error(`[${context?.operation || 'Error'}]:`, errorMessage, context?.metadata);
  }
}

export function logWarning(
  message: string,
  context?: {
    operation?: string;
    metadata?: Record<string, any>;
  }
) {
  Sentry.captureMessage(message, {
    level: 'warning',
    tags: {
      operation: context?.operation,
    },
    extra: context?.metadata,
  });

  if (process.env.NODE_ENV === 'development') {
    console.warn(`[${context?.operation || 'Warning'}]:`, message, context?.metadata);
  }
}
