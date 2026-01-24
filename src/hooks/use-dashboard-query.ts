'use client';

import { useQuery } from '@tanstack/react-query';
import { getDashboardMetrics } from '@/lib/queries';

/**
 * Custom hook for fetching dashboard metrics with React Query caching
 * 
 * Benefits:
 * - Cached for 1 minute (dashboard data changes frequently)
 * - Automatic background refetching
 * - Instant navigation back to dashboard
 */
export function useDashboardMetrics() {
  return useQuery({
    queryKey: ['dashboard', 'metrics'],
    queryFn: () => getDashboardMetrics(),
    staleTime: 60 * 1000, // 1 minute (dashboard needs fresher data)
    gcTime: 3 * 60 * 1000, // 3 minutes
    refetchOnWindowFocus: true,
  });
}

/**
 * Hook for fetching storage records
 * Note: Simplified version - filters can be added later
 */
export function useStorageRecords() {
  return useQuery({
    queryKey: ['storage-records'],
    queryFn: async () => {
      const { getStorageRecords } = await import('@/lib/queries/storage');
      return getStorageRecords();
    },
    staleTime: 90 * 1000, // 1.5 minutes
    gcTime: 5 * 60 * 1000,
  });
}

/**
 * Hook for fetching a single storage record by ID
 * Note: This requires implementing getStorageRecord in queries/storage.ts
 */
export function useStorageRecord(recordId: string | undefined) {
  return useQuery({
    queryKey: ['storage-record', recordId],
    queryFn: async () => {
      if (!recordId) throw new Error('Record ID required');
      // TODO: Implement getStorageRecord function in lib/queries/storage.ts
      // For now, fetch all and filter (not optimal but works)
      const { getStorageRecords } = await import('@/lib/queries/storage');
      const records = await getStorageRecords();
      const record = records.find(r => r.id === recordId);
      if (!record) throw new Error('Storage record not found');
      return record;
    },
    enabled: !!recordId,
    staleTime: 2 * 60 * 1000,
  });
}
