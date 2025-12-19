import { getActiveStorageRecords, getStorageStats } from "@/lib/queries";
import { StoragePageClient } from "./page-client";

export const dynamic = 'force-dynamic';

export default async function StoragePage() {
  // Parallel Fetching for optimization
  const [activeRecords, stats] = await Promise.all([
      getActiveStorageRecords(),
      getStorageStats()
  ]);

  return <StoragePageClient activeRecords={activeRecords} initialStats={stats} />;
}
