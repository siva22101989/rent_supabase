
import { getStorageRecords } from "@/lib/queries";
import { StoragePageClient } from "./page-client";

export const dynamic = 'force-dynamic';

export default async function StoragePage() {
  const allRecords = await getStorageRecords();

  return <StoragePageClient allRecords={allRecords} />;
}
