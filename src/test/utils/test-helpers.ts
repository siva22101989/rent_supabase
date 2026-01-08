import { render } from '@testing-library/react';
import { vi } from 'vitest';
import type { ReactElement } from 'react';

/**
 * Render utility with providers
 * Add ThemeProvider, etc. here as needed
 */
export function renderWithProviders(ui: ReactElement) {
  return render(ui);
}

/**
 * Mock Supabase client for testing
 */
export const mockSupabaseClient = {
  from: vi.fn(() => mockSupabaseClient),
  select: vi.fn(() => mockSupabaseClient),
  insert: vi.fn(() => mockSupabaseClient),
  update: vi.fn(() => mockSupabaseClient),
  delete: vi.fn(() => mockSupabaseClient),
  eq: vi.fn(() => mockSupabaseClient),
  is: vi.fn(() => mockSupabaseClient),
  order: vi.fn(() => mockSupabaseClient),
  single: vi.fn(() => Promise.resolve({ data: null, error: null })),
  then: vi.fn((resolve: (value: any) => void) => resolve({ data: null, error: null })),
};

/**
 * Reset all mocks between tests
 */
export function resetMocks() {
  vi.clearAllMocks();
}
