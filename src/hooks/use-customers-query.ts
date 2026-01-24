'use client';

import { useQuery } from '@tanstack/react-query';
import { getCustomers } from '@/lib/queries/customers';

/**
 * Custom hook for fetching customers with React Query caching
 * 
 * Benefits:
 * - Automatic caching (2-minute stale time)
 * - Automatic refetching on window focus
 * - Loading and error states
 * - Instant navigation (cached data)
 */
export function useCustomers() {
  return useQuery({
    queryKey: ['customers'],
    queryFn: () => getCustomers(),
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook for fetching a single customer by ID
 * Note: This requires implementing getCustomer in queries/customers.ts
 */
export function useCustomer(customerId: string | undefined) {
  return useQuery({
    queryKey: ['customer', customerId],
    queryFn: async () => {
      if (!customerId) throw new Error('Customer ID required');
      // TODO: Implement getCustomer function in lib/queries/customers.ts
      // For now, fetch all and filter (not optimal but works)
      const customers = await getCustomers();
      const customer = customers.find(c => c.id === customerId);
      if (!customer) throw new Error('Customer not found');
      return customer;
    },
    enabled: !!customerId, // Only run if customerId exists
    staleTime: 3 * 60 * 1000, // 3 minutes (customer details change less frequently)
  });
}
