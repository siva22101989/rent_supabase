import { getCustomersWithBalance } from "@/lib/queries";
import { CustomersPageClient } from "./page-client";

export const dynamic = 'force-dynamic';

export default async function CustomersPage({
  searchParams,
}: {
  searchParams?: { [key: string]: string | string[] | undefined };
}) {
  const params = await searchParams; // Await params in Nextjs 15
  const query = typeof params?.search === 'string' ? params.search : '';

  const customers = await getCustomersWithBalance(50, 0, query);
  return <CustomersPageClient initialCustomers={customers} />;
}
