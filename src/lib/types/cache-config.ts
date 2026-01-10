/**
 * Cache configuration options for queries
 */

/**
 * Cache revalidation strategies
 */
export type CacheStrategy = 
  | 'no-cache'        // Don't cache
  | 'force-cache'     // Always use cache
  | 'revalidate';     // Cache with revalidation

/**
 * Cache configuration
 */
export interface CacheConfig {
  /**
   * Cache strategy
   * @default 'revalidate'
   */
  strategy?: CacheStrategy;

  /**
   * Revalidation time in seconds
   * @default 60
   */
  revalidate?: number;

  /**
   * Cache tags for on-demand revalidation
   */
  tags?: string[];

  /**
   * Whether to cache on the client
   * @default false
   */
  clientCache?: boolean;
}

/**
 * Default cache configurations for different query types
 */
export const DEFAULT_CACHE_CONFIG: Record<string, CacheConfig> = {
  // Fast-changing data - short cache
  storage: {
    strategy: 'revalidate',
    revalidate: 30, // 30 seconds
    tags: ['storage'],
  },

  // Moderate-changing data
  customers: {
    strategy: 'revalidate',
    revalidate: 60, // 1 minute
    tags: ['customers'],
  },

  // Slow-changing data
  expenses: {
    strategy: 'revalidate',
    revalidate: 300, // 5 minutes
    tags: ['expenses'],
  },

  // Static/reference data - long cache
  warehouses: {
    strategy: 'revalidate',
    revalidate: 3600, // 1 hour
    tags: ['warehouses'],
  },

  // Real-time data - no cache
  analytics: {
    strategy: 'no-cache',
  },
};

/**
 * Get cache config for a query type
 */
export function getCacheConfig(queryType: string): CacheConfig {
  return DEFAULT_CACHE_CONFIG[queryType] || {
    strategy: 'revalidate',
    revalidate: 60,
  };
}

/**
 * Apply cache config to Next.js fetch options
 */
export function applyCacheConfig(config: CacheConfig): RequestInit {
  const { strategy = 'revalidate', revalidate = 60, tags = [] } = config;

  if (strategy === 'no-cache') {
    return { cache: 'no-store' };
  }

  if (strategy === 'force-cache') {
    return { cache: 'force-cache' };
  }

  // Revalidate strategy
  return {
    next: {
      revalidate,
      tags,
    },
  };
}
