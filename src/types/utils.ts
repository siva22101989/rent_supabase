/**
 * Utility types for improved type safety across the application
 * 
 * These types help enforce stricter type checking and provide
 * better developer experience with TypeScript.
 */

// ============================================================================
// API Response Types
// ============================================================================

/**
 * Successful API response
 */
export type ApiSuccess<T> = {
  success: true;
  data: T;
};

/**
 * Failed API response
 */
export type ApiError = {
  success: false;
  error: string;
  code?: string;
  details?: Record<string, unknown>;
};

/**
 * Generic API response type
 * @example
 * ```typescript
 * const response: ApiResponse<Customer> = await fetchCustomer(id);
 * if (response.success) {
 *   console.log(response.data.name);
 * } else {
 *   console.error(response.error);
 * }
 * ```
 */
export type ApiResponse<T> = ApiSuccess<T> | ApiError;

// ============================================================================
// Form State Types
// ============================================================================

/**
 * Generic form state for server actions
 */
export type FormState<T = unknown> = {
  success: boolean;
  message: string;
  data?: T;
  errors?: Record<string, string[]>;
};

/**
 * Successful form submission
 */
export type FormSuccess<T = unknown> = {
  success: true;
  message: string;
  data?: T;
};

/**
 * Failed form submission
 */
export type FormError = {
  success: false;
  message: string;
  errors?: Record<string, string[]>;
};

// ============================================================================
// Pagination Types
// ============================================================================

/**
 * Paginated response wrapper
 */
export type PaginatedResponse<T> = {
  data: T[];
  pagination: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
    hasMore: boolean;
  };
};

/**
 * Pagination parameters
 */
export type PaginationParams = {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
};

// ============================================================================
// Branded Types (for type safety)
// ============================================================================

/**
 * Brand a primitive type to prevent accidental mixing
 * @example
 * ```typescript
 * type UserId = Brand<string, 'UserId'>;
 * type CustomerId = Brand<string, 'CustomerId'>;
 * 
 * const userId: UserId = 'user-123' as UserId;
 * const customerId: CustomerId = userId; // Error: Type mismatch
 * ```
 */
export type Brand<T, TBrand extends string> = T & { readonly __brand: TBrand };

/**
 * UUID type for database IDs
 */
export type UUID = Brand<string, 'UUID'>;

/**
 * ISO date string type
 */
export type ISODateString = Brand<string, 'ISODateString'>;

// ============================================================================
// Utility Helper Types
// ============================================================================

/**
 * Make specific properties required
 * @example
 * ```typescript
 * type User = { id?: string; name?: string; email?: string };
 * type UserWithId = RequireFields<User, 'id'>; // id is required, others optional
 * ```
 */
export type RequireFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

/**
 * Make specific properties optional
 * @example
 * ```typescript
 * type User = { id: string; name: string; email: string };
 * type UserInput = OptionalFields<User, 'id'>; // id is optional
 * ```
 */
export type OptionalFields<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

/**
 * Extract non-nullable properties
 */
export type NonNullableFields<T> = {
  [P in keyof T]: NonNullable<T[P]>;
};

/**
 * Deep partial type
 */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

/**
 * Deep readonly type
 */
export type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends object ? DeepReadonly<T[P]> : T[P];
};

// ============================================================================
// Async Types
// ============================================================================

/**
 * Unwrap a Promise type
 * @example
 * ```typescript
 * type Result = Awaited<Promise<string>>; // string
 * ```
 */
export type Awaited<T> = T extends Promise<infer U> ? U : T;

/**
 * Async function type
 */
export type AsyncFunction<TArgs extends any[] = any[], TReturn = any> = (
  ...args: TArgs
) => Promise<TReturn>;

// ============================================================================
// Query Types
// ============================================================================

/**
 * Filter operators for database queries
 */
export type FilterOperator = 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'like' | 'in';

/**
 * Query filter
 */
export type QueryFilter<T> = {
  field: keyof T;
  operator: FilterOperator;
  value: any;
};

/**
 * Query options
 */
export type QueryOptions<T> = {
  filters?: QueryFilter<T>[];
  search?: string;
  pagination?: PaginationParams;
  include?: (keyof T)[];
  exclude?: (keyof T)[];
};

// ============================================================================
// Type Guards
// ============================================================================

/**
 * Check if value is defined (not null or undefined)
 */
export function isDefined<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}

/**
 * Check if API response is successful
 */
export function isApiSuccess<T>(
  response: ApiResponse<T>
): response is ApiSuccess<T> {
  return response.success === true;
}

/**
 * Check if API response is an error
 */
export function isApiError<T>(
  response: ApiResponse<T>
): response is ApiError {
  return response.success === false;
}

/**
 * Check if form state is successful
 */
export function isFormSuccess<T>(
  state: FormState<T>
): state is FormSuccess<T> {
  return state.success === true;
}

/**
 * Check if form state is an error
 */
export function isFormError<T>(
  state: FormState<T>
): state is FormError {
  return state.success === false;
}

// ============================================================================
// Validation Types
// ============================================================================

/**
 * Validation result
 */
export type ValidationResult<T> =
  | { valid: true; data: T }
  | { valid: false; errors: Record<string, string[]> };

/**
 * Validator function type
 */
export type Validator<T> = (value: unknown) => ValidationResult<T>;
