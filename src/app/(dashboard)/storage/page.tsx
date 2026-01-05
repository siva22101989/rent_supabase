import { getPaginatedStorageRecords, getStorageStats, getCustomers } from "@/lib/queries";
import { StoragePageClient } from "./page-client";

// Revalidate every 60 seconds - storage data changes moderately
export const revalidate = 60;

export default async function StoragePage({ 
  searchParams 
}: { 
  searchParams: Promise<{ page?: string; q?: string }> 
}) {
  const resolvedSearchParams = await searchParams;
  const page = Number(resolvedSearchParams.page) || 1;
  const query = resolvedSearchParams.q || '';

  // Parallel Fetching for optimization
  const [paginatedResult, stats, customers] = await Promise.all([
      getPaginatedStorageRecords(page, 25, query, 'active'),
      getStorageStats(),
      getCustomers()
  ]);

  return (
    <StoragePageClient 
      records={paginatedResult.records} 
      totalPages={paginatedResult.totalPages}
      currentPage={page}
      initialStats={stats} 
      customers={customers} 
    />
  );
}
