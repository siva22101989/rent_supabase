import { getActiveStorageRecords, getStorageStats, getCustomers } from "@/lib/queries";
import { StoragePageClient } from "./page-client";

export const dynamic = 'force-dynamic';

export default async function StoragePage() {
  // Parallel Fetching for optimization
  const [activeRecords, stats, customers] = await Promise.all([
      getActiveStorageRecords(),
      getStorageStats(),
      getCustomers()
  ]);

  return <StoragePageClient activeRecords={activeRecords} initialStats={stats} customers={customers} />;
}
