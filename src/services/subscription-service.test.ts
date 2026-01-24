import { describe, it, expect, vi, beforeEach } from 'vitest';
import { checkSubscriptionLimits, checkFeatureAccess } from '@/services/subscription-service';
import { SubscriptionStatus } from '@/types/db';

// Mock Supabase Client
const mockSelect = vi.fn();
const mockEq = vi.fn();
const mockSingle = vi.fn();
const mockFrom = vi.fn();
const mockRpc = vi.fn();

const mockSupabase = {
    from: mockFrom,
    rpc: mockRpc,
};

// Chainable mock setup
mockFrom.mockReturnValue({
    select: mockSelect
});
mockSelect.mockReturnValue({
    eq: mockEq,
});
mockEq.mockReturnValue({
    single: mockSingle,
});

vi.mock('@/utils/supabase/server', () => ({
    createClient: vi.fn(() => Promise.resolve(mockSupabase))
}));

describe('Subscription Service', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Clear cache between tests to ensure isolation
        // Access private map if possible or add method, for now we assume implementation exposes a way or we mock Date.now
        
        // Reset defaults
        mockFrom.mockReturnValue({ select: mockSelect });
        mockSelect.mockReturnValue({ eq: mockEq });
        mockEq.mockReturnValue({ single: mockSingle });
        
        // Needed for getSubscription
        mockSingle.mockResolvedValue({ data: null });
        mockRpc.mockResolvedValue({ data: [{ total_records: 0, monthly_records: 0, total_users: 0 }], error: null });
    });

    describe('checkSubscriptionLimits', () => {
        it('allows action when subscription is active and within limits', async () => {
             const mockSubscription = {
                plans: { max_storage_records: 100 },
                status: SubscriptionStatus.ACTIVE,
                current_period_end: new Date(Date.now() + 100000).toISOString()
            };

            // Mock getSubscription
            mockFrom.mockImplementation((table) => {
                if (table === 'subscriptions') {
                    return { select: () => ({ eq: () => ({ single: () => Promise.resolve({ data: mockSubscription, error: null }) }) }) };
                }
                return { select: () => ({ eq: () => ({ single: () => Promise.resolve({ data: null }) }) }) };
            });

            // Mock RPC Usage Stats
            mockRpc.mockResolvedValue({ 
                data: [{ 
                    total_records: 10, 
                    monthly_records: 5, 
                    total_users: 2 
                }], 
                error: null 
            });

            const result = await checkSubscriptionLimits('w-123-allowed', 'add_record');
            expect(result.allowed).toBe(true);
            expect(mockRpc).toHaveBeenCalledWith('get_warehouse_usage_stats', expect.anything());
        });

        it('blocks action when plan limit is reached', async () => {
            const mockSubscription = {
                plans: { max_storage_records: 10 },
                status: SubscriptionStatus.ACTIVE,
                current_period_end: new Date(Date.now() + 100000).toISOString()
            };

            mockFrom.mockImplementation((table) => {
                if (table === 'subscriptions') {
                    return { select: () => ({ eq: () => ({ single: () => Promise.resolve({ data: mockSubscription, error: null }) }) }) };
                }
                return { select: () => ({ eq: () => ({ single: () => Promise.resolve({ data: null }) }) }) };
            });

            // Usage = Limit = 10 -> Blocked
            mockRpc.mockResolvedValue({ 
                data: [{ 
                    total_records: 10, 
                    monthly_records: 0, 
                    total_users: 1 
                }], 
                error: null 
            });

            const result = await checkSubscriptionLimits('w-123-blocked', 'add_record');
            expect(result.allowed).toBe(false);
            expect(result.message).toContain('Plan limit reached');
        });
    });

    describe('checkFeatureAccess (PlanCache)', () => {
         it('uses cached plan on second call', async () => {
             const mockSubscription = {
                plans: { features: { 'analytics': true } },
                status: SubscriptionStatus.ACTIVE
            };
            
            // First call: Hits DB
            mockFrom.mockImplementationOnce(() => ({
                select: () => ({ eq: () => ({ single: () => Promise.resolve({ data: mockSubscription, error: null }) }) })
            }));

            // Force cache miss first
            // Note: In real environment, we'd depend on internal state. 
            // Here we rely on mockFrom calls count.
            
            // NOTE: We need to clear singleton cache carefully if tests run in same process.
            // But for this test let's use a unique ID to ensure fresh cache
            const uniqueId = 'w-cache-test-' + Date.now();
            
            // 1st Check
            await checkFeatureAccess(uniqueId, 'analytics');
            expect(mockFrom).toHaveBeenCalledTimes(1);
            
            // 2nd Check (Same ID) - Should NOT hit DB
            mockFrom.mockClear();
            await checkFeatureAccess(uniqueId, 'analytics');
            expect(mockFrom).not.toHaveBeenCalled(); 
         });
    });
});
