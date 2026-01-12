import { getPaginatedStorageRecords, getStorageStats, getCustomers } from "@/lib/queries";
import { StoragePageClient } from "./page-client";
import { createClient } from "@/utils/supabase/server";
import { getUserWarehouse } from "@/lib/queries/warehouses";
import { getCurrentUserRole } from "@/lib/queries";

// Revalidate every 30 seconds - storage data changes frequently
export const revalidate = 30;

export const metadata = {
  title: 'Storage',
  description: 'Manage warehouse inventory and storage records.',
};

export default async function StoragePage({ 
  searchParams 
}: { 
  searchParams: Promise<{ page?: string; q?: string }> 
}) {
  const resolvedSearchParams = await searchParams;
  const page = Number(resolvedSearchParams.page) || 1;
  const query = resolvedSearchParams.q || '';
  
  const supabase = await createClient();
  const warehouseId = await getUserWarehouse();

  // Parallel Fetching for optimization
  const [paginatedResult, stats, customers, userRole, crops, lots] = await Promise.all([
      getPaginatedStorageRecords(page, 25, query, 'active'),
      getStorageStats(),
      getCustomers(),
      getCurrentUserRole(),
      supabase.from('crops').select('id, name').eq('warehouse_id', warehouseId).order('name').then(res => res.data || []),
      supabase.from('warehouse_lots').select('id, name').eq('warehouse_id', warehouseId).is('deleted_at', null).order('name').then(res => res.data || [])
  ]);

  return (
    <StoragePageClient 
      records={paginatedResult.records} 
      totalPages={paginatedResult.totalPages}
      currentPage={page}
      initialStats={stats} 
      customers={customers}
      userRole={userRole}
      crops={crops}
      lots={lots}
    />
  );
}
