import useSWR from 'swr';
import { fetchDashboardMetrics } from '@/lib/actions';

const CACHE_KEY = 'grainflow_dashboard_metrics';

// SWR fetcher wrapper
const fetcher = async () => {
    return await fetchDashboardMetrics();
};

export function useDashboardMetrics(initialData?: any) {
    const { data, error, isLoading, mutate } = useSWR(CACHE_KEY, fetcher, {
        fallbackData: initialData,
        revalidateOnFocus: true,
        revalidateOnReconnect: true,
        refreshInterval: 0, // Disable auto-polling unless needed
        dedupingInterval: 60000, // 1 minute dedupe
        keepPreviousData: true
    });

    return {
        metrics: data,
        isLoading,
        isError: error,
        mutate
    };
}
