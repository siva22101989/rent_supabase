
import { getCustomers, getStorageRecords } from "@/lib/queries";
import { CustomersPageClient } from "./page-client";

export const dynamic = 'force-dynamic';

export default async function CustomersPage() {
  const [customers, records] = await Promise.all([
    getCustomers(),
    getStorageRecords()
  ]);

  return <CustomersPageClient customers={customers} records={records} />;
}
