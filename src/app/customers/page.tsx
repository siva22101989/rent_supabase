
import { getCustomers, getStorageRecords } from "@/lib/queries";
import { CustomersPageClient } from "./page-client";

export const dynamic = 'force-dynamic';

export default async function CustomersPage() {
  const records = await getStorageRecords(); // Keep records for now as they are dynamic/complex
  // Customers will be fetched on client via context (cached)
  return <CustomersPageClient customers={[]} records={records} />;
}
