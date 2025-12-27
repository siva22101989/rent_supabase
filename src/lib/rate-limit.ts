
/**
 * Simple in-memory rate limiter for server actions.
 * In a production environment with multiple instances, use Redis or a similar external store.
 */

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

const store: RateLimitStore = {};

interface RateLimitOptions {
  limit?: number; // Max requests
  windowMs?: number; // Time window in milliseconds
}

export async function rateLimit(
  identifier: string,
  options: RateLimitOptions = {}
): Promise<{ success: boolean; limit: number; remaining: number; reset: number }> {
  const { limit = 10, windowMs = 60000 } = options;
  const now = Date.now();
  
  // Cleanup old entries periodically (could be more sophisticated)
  if (Math.random() < 0.05) {
     Object.keys(store).forEach(key => {
        if (store[key].resetTime < now) delete store[key];
     });
  }

  if (!store[identifier] || store[identifier].resetTime < now) {
    store[identifier] = {
      count: 0,
      resetTime: now + windowMs,
    };
  }

  store[identifier].count++;

  return {
    success: store[identifier].count <= limit,
    limit,
    remaining: Math.max(0, limit - store[identifier].count),
    reset: store[identifier].resetTime,
  };
}

/**
 * Helper to apply rate limiting to a server action.
 * Throws an error if rate limit is exceeded.
 */
export async function checkRateLimit(
  identifier: string,
  actionName: string,
  options: RateLimitOptions = {}
) {
  const result = await rateLimit(`${actionName}:${identifier}`, options);
  
  if (!result.success) {
    throw new Error('Too many requests. Please try again later.');
  }
  
  return result;
}
