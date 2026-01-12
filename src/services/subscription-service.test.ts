import { describe, it, expect, vi, beforeEach } from 'vitest';
import { checkSubscriptionLimits, checkFeatureAccess, checkWarehouseCreationLimit } from '@/services/subscription-service';
import { SubscriptionStatus, UserRole } from '@/types/db';

// Mock Supabase Client
const mockSelect = vi.fn();
const mockEq = vi.fn();
const mockSingle = vi.fn();
const mockFrom = vi.fn();
const mockRpc = vi.fn();
const mockIs = vi.fn();
const mockGt = vi.fn();

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
    single: mockSingle,
    is: mockIs,
    gte: mockGt
});
mockEq.mockReturnValue({
    single: mockSingle,
    eq: mockEq, // chaining for multiple eqs
    is: mockIs
});
mockGt.mockReturnValue({
    single: mockSingle // simplistic chain
});
mockIs.mockReturnValue({
    single: mockSingle
});

vi.mock('@/utils/supabase/server', () => ({
    createClient: vi.fn(() => Promise.resolve(mockSupabase))
}));

describe('Subscription Service', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        
        // Default chain behavior
        mockFrom.mockReturnValue({ select: mockSelect });
        mockSelect.mockReturnValue({ eq: mockEq, is: mockIs, gte: mockGt });
        mockEq.mockReturnValue({ single: mockSingle, eq: mockEq, is: mockIs });
        mockGt.mockReturnValue({}); // end chain
        mockIs.mockReturnValue({}); // end chain
    });

    describe('checkSubscriptionLimits', () => {
        it('allows action when subscription is active and within limits', async () => {
            // Mock getSubscriptionWithUsage internal call structure
            // Since checkSubscriptionLimits calls getSubscriptionWithUsage which calls supabase multiple times.
            // This relies on implementation details which is brittle, but necessary for unit integration test without real DB.
            
            // Actually, getSubscriptionWithUsage calls getSubscription (1 call) + 3 parallel calls.
            // 4 DB calls total.
            
            // To make this easier, we should perhaps mock getSubscriptionWithUsage?
            // checking if we can mock a function in the same module... usually tricky with ESM.
            // Better to mock the DB responses.
            
            // Call 1: getSubscription -> from('subscriptions').select...
            const mockSubscription = {
                plans: { max_storage_records: 100 },
                status: SubscriptionStatus.ACTIVE,
                current_period_end: new Date(Date.now() + 100000).toISOString()
            };
            
            // Call 2,3,4: storage_records (total), monthly, assignments
            // We need to differentiate calls based on table name.
            
            mockFrom.mockImplementation((table) => {
                if (table === 'subscriptions') {
                    return {
                        select: () => ({
                            eq: () => ({
                                single: () => Promise.resolve({ data: mockSubscription, error: null })
                            })
                        })
                    };
                }
                if (table === 'storage_records') {
                     return {
                        select: () => ({
                            eq: () => ({
                                is: () => Promise.resolve({ count: 10 }), // total records
                                gte: () => Promise.resolve({ count: 5 }) // monthly records
                            })
                        })
                     };
                }
                if (table === 'warehouse_assignments') {
                    return {
                        select: () => ({
                            eq: () => ({
                                is: () => Promise.resolve({ count: 2 })
                            })
                        })
                    };
                }
                return { select: () => ({ eq: () => ({ single: () => Promise.resolve({ data: null }) }) }) };
            });

            const result = await checkSubscriptionLimits('w-123', 'add_record');
            expect(result.allowed).toBe(true);
        });

        it('blocks action when plan limit is reached', async () => {
            const mockSubscription = {
                plans: { max_storage_records: 10 }, // Limit 10
                status: SubscriptionStatus.ACTIVE,
                current_period_end: new Date(Date.now() + 100000).toISOString()
            };
            
            mockFrom.mockImplementation((table) => {
                if (table === 'subscriptions') {
                    return {
                        select: () => ({
                            eq: () => ({
                                single: () => Promise.resolve({ data: mockSubscription, error: null })
                            })
                        })
                    };
                }
                if (table === 'storage_records') {
                     return {
                        select: () => ({
                            eq: () => ({
                                is: () => Promise.resolve({ count: 10 }), // Usage 10 = Limit 10 -> Blocked
                                gte: () => Promise.resolve({ count: 0 })
                            })
                        })
                     };
                }
                if (table === 'warehouse_assignments') {
                     return { select: () => ({ eq: () => ({ is: () => Promise.resolve({ count: 0 }) }) }) };
                }
                return { select: () => ({ eq: () => ({ single: () => Promise.resolve({ data: null }) }) }) };
            });

            const result = await checkSubscriptionLimits('w-123', 'add_record');
            expect(result.allowed).toBe(false);
            expect(result.message).toContain('Plan limit reached');
        });
    });

    describe('checkFeatureAccess', () => {
        it('allows access to feature included in plan', async () => {
             const mockSubscription = {
                plans: { 
                    name: 'Pro',
                    features: { 'analytics': true } 
                },
                status: SubscriptionStatus.ACTIVE,
                current_period_end: new Date(Date.now() + 100000).toISOString()
            };
            
            mockFrom.mockImplementation((table) => {
                if (table === 'subscriptions') {
                    return {
                        select: () => ({
                            eq: () => ({
                                single: () => Promise.resolve({ data: mockSubscription, error: null })
                            })
                        })
                    };
                }
                return { select: () => ({ eq: () => ({ single: () => Promise.resolve({ data: null }) }) }) };
            });

            const result = await checkFeatureAccess('w-123', 'analytics');
            expect(result.allowed).toBe(true);
        });

        it('denies access to feature NOT included in plan', async () => {
             const mockSubscription = {
                plans: { 
                    name: 'Basic',
                    features: { 'analytics': false } 
                },
                status: SubscriptionStatus.ACTIVE,
                current_period_end: new Date(Date.now() + 100000).toISOString()
            };
            
            mockFrom.mockImplementation((table) => {
                if (table === 'subscriptions') {
                    return {
                        select: () => ({
                            eq: () => ({
                                single: () => Promise.resolve({ data: mockSubscription, error: null })
                            })
                        })
                    };
                }
                return { select: () => ({ eq: () => ({ single: () => Promise.resolve({ data: null }) }) }) };
            });

            const result = await checkFeatureAccess('w-123', 'advanced_reports');
            expect(result.allowed).toBe(false);
            expect(result.message).toContain('does not support this feature');
        });
    });
});
