/**
 * Common query options and types for database queries
 */

/**
 * Pagination options for queries
 */
export interface PaginationOptions {
  limit?: number;
  offset?: number;
}

/**
 * Storage record query options
 */
export interface StorageQueryOptions {
  activeOnly?: boolean;
  customerId?: string;
  includePayments?: boolean;
  includeCustomer?: boolean;
}

/**
 * Customer query options
 */
export interface CustomerQueryOptions {
  search?: string;
  pendingOnly?: boolean;
  includeBalance?: boolean;
}

/**
 * Expense query options
 */
export interface ExpenseQueryOptions {
  category?: string;
  dateFrom?: Date;
  dateTo?: Date;
  minAmount?: number;
  maxAmount?: number;
}

/**
 * Combined query options with pagination
 */
export type QueryOptions<T = {}> = PaginationOptions & T;

/**
 * Query result with metadata
 */
export interface QueryResult<T> {
  data: T[];
  totalCount: number;
  page?: number;
  pageSize?: number;
  totalPages?: number;
}

/**
 * Sort direction
 */
export type SortDirection = 'asc' | 'desc';

/**
 * Sort options
 */
export interface SortOptions {
  field: string;
  direction: SortDirection;
}

/**
 * Filter operator types
 */
export type FilterOperator = 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'like';

/**
 * Generic filter
 */
export interface Filter {
  field: string;
  operator: FilterOperator;
  value: any;
}

/**
 * Advanced query options with filters and sorting
 */
export interface AdvancedQueryOptions extends PaginationOptions {
  filters?: Filter[];
  sort?: SortOptions;
  search?: string;
}
