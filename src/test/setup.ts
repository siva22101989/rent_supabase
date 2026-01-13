import { vi, expect } from 'vitest'
import '@testing-library/jest-dom'

// Note: If matchers are not automatically picked up, we'll use a different strategy.

// Mock react cache
vi.mock('react', async (importOriginal) => {
  const actual: any = await importOriginal();
  return {
    ...actual,
    cache: (fn: any) => fn,
  };
});

// Mock next/cache
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
}));

// Mock next/navigation
vi.mock('next/navigation', () => ({
  redirect: vi.fn(),
  useRouter: vi.fn(),
  usePathname: vi.fn(),
}));

import { beforeAll, afterEach, afterAll } from 'vitest'
import { server } from '../mocks/server'

beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())
