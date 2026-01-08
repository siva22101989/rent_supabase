/**
 * Application Constants
 * Task 1.3.4: Centralize magic numbers and configuration values
 */

// Billing Rates (Default fallback if dynamic pricing not available)
export const BILLING_RATES = {
  SIX_MONTHS: 36,
  ONE_YEAR: 55,
} as const;

// Cache Revalidation Times (in seconds)
export const REVALIDATION_TIMES = {
  INFLOW: 30,
  OUTFLOW: 30,
  PAYMENTS: 30,
  EXPENSES: 60,
  BILLING: 60,
  SETTINGS: 300,       // 5 minutes
  MARKET_PRICES: 1800, // 30 minutes
} as const;

// Pagination Configuration
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 10,
} as const;

// Date Formats
export const DATE_FORMATS = {
  DISPLAY: 'dd/MM/yyyy',
  DATABASE: 'yyyy-MM-dd',
} as const;

// Error Messages
export const ERROR_MESSAGES = {
  GENERIC: 'Something went wrong. Please try again.',
  UNAUTHORIZED: 'You are not authorized to perform this action.',
  VALIDATION_FAILED: 'Validation failed. Please check your inputs.',
  NOT_FOUND: 'Resource not found.',
} as const;
