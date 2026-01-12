import { describe, it, expect, vi, beforeEach } from 'vitest'
import { checkRateLimit } from './rate-limit'

// Mock Supabase
const mockSupabase = {
  rpc: vi.fn(),
};

// Mock createClient
vi.mock('@/utils/supabase/server', () => ({
  createClient: () => Promise.resolve(mockSupabase),
}));

describe('checkRateLimit', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    // Default success response
    mockSupabase.rpc.mockResolvedValue({ data: true, error: null });
  })

  it('should allow requests within limit', async () => {
    const identifier = 'test-user-1'
    const action = 'test-action'
    
    // Should not throw
    await expect(checkRateLimit(identifier, action, { limit: 2 })).resolves.not.toThrow()
    await expect(checkRateLimit(identifier, action, { limit: 2 })).resolves.not.toThrow()
  })

  it('should throw when limit is exceeded', async () => {
    const identifier = 'test-user-2'
    const action = 'test-action'
    
    // Mock RPC returning false (limit exceeded)
    mockSupabase.rpc.mockResolvedValueOnce({ data: false, error: null })
    
    await expect(checkRateLimit(identifier, action, { limit: 1 }))
      .rejects.toThrow('Too many requests. Please try again later.')
  })

  it('should reset limit after window passes', async () => {
    const identifier = 'test-user-3'
    const action = 'test-action'
    const windowMs = 1000 // 1 second
    
    await checkRateLimit(identifier, action, { limit: 1, windowMs })
    
    // Fast forward time
    vi.advanceTimersByTime(windowMs + 100)
    
    // Should allow again
    await expect(checkRateLimit(identifier, action, { limit: 1, windowMs })).resolves.not.toThrow()
  })

  it('should differentiate by identifier and action', async () => {
    const identifier1 = 'user-a'
    const identifier2 = 'user-b'
    const action = 'login'
    
    // Sequence: 
    // 1. identifier1 first call -> true
    // 2. identifier2 first call -> true
    // 3. identifier1 second call -> false (exceeded)
    mockSupabase.rpc
        .mockResolvedValueOnce({ data: true, error: null })
        .mockResolvedValueOnce({ data: true, error: null })
        .mockResolvedValueOnce({ data: false, error: null });

    await checkRateLimit(identifier1, action, { limit: 1 })
    
    // Identifier 2 should still be allowed
    await expect(checkRateLimit(identifier2, action, { limit: 1 })).resolves.not.toThrow()
    
    // Identifier 1 should be blocked
    await expect(checkRateLimit(identifier1, action, { limit: 1 })).rejects.toThrow()
  })
})
