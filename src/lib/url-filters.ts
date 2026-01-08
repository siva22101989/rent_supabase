import { DateRange } from 'react-day-picker';

/**
 * Generic filter state interface
 */
export interface FilterState {
  [key: string]: any;
}

/**
 * Storage page specific filter state
 */
export interface StorageFilterState {
  search: string;
  status: 'active' | 'released' | 'all';
  selectedCommodities: string[];
  selectedLocations: string[];
  dateFrom: Date | null;
  dateTo: Date | null;
  minBags: number | null;
  maxBags: number | null;
  minRent: number | null;
  maxRent: number | null;
  sortBy: string;
  page: number;
}

/**
 * Serialize filter state to URL search parameters
 */
export function filtersToSearchParams(filters: FilterState): URLSearchParams {
  const params = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (value === null || value === undefined || value === '') {
      return; // Skip empty values
    }

    // Handle arrays (comma-separated)
    if (Array.isArray(value)) {
      if (value.length > 0) {
        params.set(key, value.join(','));
      }
      return;
    }

    // Handle dates (ISO string)
    if (value instanceof Date) {
      params.set(key, value.toISOString().split('T')[0]); // YYYY-MM-DD format
      return;
    }

    // Handle DateRange object
    if (typeof value === 'object' && 'from' in value) {
      const dateRange = value as DateRange;
      if (dateRange.from) {
        params.set('dateFrom', dateRange.from.toISOString().split('T')[0]);
      }
      if (dateRange.to) {
        params.set('dateTo', dateRange.to.toISOString().split('T')[0]);
      }
      return;
    }

    // Handle boolean
    if (typeof value === 'boolean') {
      params.set(key, value ? '1' : '0');
      return;
    }

    // Handle numbers and strings
    params.set(key, String(value));
  });

  return params;
}

/**
 * Parse URL search parameters to filter state
 */
export function searchParamsToFilters<T extends FilterState>(
  params: URLSearchParams,
  defaults: T
): T {
  const filters: any = { ...defaults }; // Use 'any' to allow mutations

  params.forEach((value, key) => {
    // Skip if key not in defaults
    if (!(key in defaults)) {
      return;
    }

    const defaultValue = defaults[key];

    // Handle arrays
    if (Array.isArray(defaultValue)) {
      filters[key] = value.split(',').filter(Boolean);
      return;
    }

    // Handle dates
    if (defaultValue instanceof Date || key.includes('date') || key.includes('Date')) {
      const date = new Date(value);
      filters[key] = isNaN(date.getTime()) ? null : date;
      return;
    }

    // Handle numbers
    if (typeof defaultValue === 'number' || key.includes('min') || key.includes('max') || key === 'page') {
      const num = Number(value);
      filters[key] = isNaN(num) ? null : num;
      return;
    }

    // Handle boolean
    if (typeof defaultValue === 'boolean') {
      filters[key] = value === '1' || value === 'true';
      return;
    }

    // Handle string
    filters[key] = value;
  });

  // Reconstruct DateRange if dateFrom/dateTo exist
  if ('dateFrom' in filters || 'dateTo' in filters) {
    const from = params.get('dateFrom');
    const to = params.get('dateTo');
    
    if (from || to) {
      filters.dateRange = {
        from: from ? new Date(from) : undefined,
        to: to ? new Date(to) : undefined,
      };
    }
  }

  return filters as T;
}

/**
 * Get shareable URL with current filters
 */
export function getShareableFilterUrl(filters: FilterState): string {
  const params = filtersToSearchParams(filters);
  const baseUrl = typeof window !== 'undefined' ? window.location.origin + window.location.pathname : '';
  return `${baseUrl}?${params.toString()}`;
}

/**
 * Get human-readable filter summary
 */
export function getAppliedFiltersSummary(filters: FilterState): { label: string; value: string }[] {
  const summary: { label: string; value: string }[] = [];

  Object.entries(filters).forEach(([key, value]) => {
    if (value === null || value === undefined || value === '' || value === false) {
      return;
    }

    // Skip default values
    if (key === 'status' && value === 'active') return;
    if (key === 'page' && value === 1) return;
    if (key === 'sortBy') return; // Don't show sort in summary

    // Format label
    const label = key
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, (str) => str.toUpperCase())
      .replace('Selected ', '')
      .replace('min ', 'Min ')
      .replace('max ', 'Max ');

    // Format value
    let displayValue: string;

    if (Array.isArray(value)) {
      displayValue = value.join(', ');
    } else if (value instanceof Date) {
      displayValue = value.toLocaleDateString();
    } else if (typeof value === 'object' && 'from' in value) {
      const dateRange = value as DateRange;
      const from = dateRange.from?.toLocaleDateString() || 'Any';
      const to = dateRange.to?.toLocaleDateString() || 'Any';
      displayValue = `${from} - ${to}`;
    } else {
      displayValue = String(value);
    }

    summary.push({ label, value: displayValue });
  });

  return summary;
}

/**
 * Count active filters (non-default values)
 */
export function countActiveFilters(filters: FilterState, defaults: FilterState): number {
  let count = 0;

  Object.entries(filters).forEach(([key, value]) => {
    const defaultValue = defaults[key];

    // Skip if equal to default
    if (value === defaultValue) return;
    
    // Skip null/undefined/empty
    if (value === null || value === undefined || value === '') return;
    
    // Skip empty arrays
    if (Array.isArray(value) && value.length === 0) return;
    
    // Skip page and sortBy (not considered "filters")
    if (key === 'page' || key === 'sortBy') return;

    count++;
  });

  return count;
}
