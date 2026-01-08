import { useEffect, useState, useRef } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useDebounce } from '@uidotdev/usehooks';
import { filtersToSearchParams, searchParamsToFilters, type FilterState } from '@/lib/url-filters';

export interface UseUrlFiltersOptions {
  /**
   * Debounce delay in milliseconds before updating URL
   * @default 300
   */
  debounce?: number;
  
  /**
   * Whether to use replace or push for navigation
   * @default true (replace - no history pollution)
   */
  replace?: boolean;
  
  /**
   * Whether to scroll to top on filter change
   * @default false
   */
  scroll?: boolean;
}

/**
 * Custom hook for managing filter state synchronized with URL parameters
 * 
 * @example
 * ```tsx
 * const [filters, setFilters] = useUrlFilters({
 *   search: '',
 *   status: 'active',
 *   selectedCommodities: [],
 *   page: 1
 * });
 * 
 * // Update filters
 * setFilters(prev => ({ ...prev, search: 'paddy' }));
 * ```
 */
export function useUrlFilters<T extends FilterState>(
  defaults: T,
  options: UseUrlFiltersOptions = {}
) {
  const { debounce = 300, replace = true, scroll = false } = options;
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  
  // Initialize from URL on mount
  const [filters, setFilters] = useState<T>(() => {
    return searchParamsToFilters(searchParams, defaults);
  });
  
  // Track if this is initial mount
  const isInitialMount = useRef(true);
  
  // Debounced filters for URL updates
  const debouncedFilters = useDebounce(filters, debounce);
  
  // Sync URL when debounced filters change
  useEffect(() => {
    // Skip URL update on initial mount (already loaded from URL)
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    
    const params = filtersToSearchParams(debouncedFilters);
    const newUrl = `${pathname}?${params.toString()}`;
    
    if (replace) {
      router.replace(newUrl, { scroll });
    } else {
      router.push(newUrl, { scroll });
    }
  }, [debouncedFilters, pathname, router, replace, scroll]);
  
  // Update filters when URL changes externally (browser back/forward)
  useEffect(() => {
    const newFilters = searchParamsToFilters(searchParams, defaults);
    
    // Only update if different to avoid infinite loop
    const isDifferent = JSON.stringify(newFilters) !== JSON.stringify(filters);
    
    if (isDifferent) {
      setFilters(newFilters);
    }
  }, [searchParams]); // Intentionally don't include filters/defaults to avoid loop
  
  return [filters, setFilters] as const;
}

/**
 * Hook to get current filter state from URL without state management
 * Useful for server components or when you only need to read filters
 */
export function useUrlFiltersReadOnly<T extends FilterState>(defaults: T): T {
  const searchParams = useSearchParams();
  return searchParamsToFilters(searchParams, defaults);
}
