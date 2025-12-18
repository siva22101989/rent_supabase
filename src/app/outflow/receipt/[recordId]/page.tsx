import { AppLayout } from "@/components/layout/app-layout";
import { PageHeader } from "@/components/shared/page-header";
import { OutflowReceipt } from "@/components/outflow/outflow-receipt";
import { getStorageRecord, getCustomer, getWarehouseDetails } from "@/lib/queries";
import { notFound } from "next/navigation";

export const dynamic = 'force-dynamic';

export default async function OutflowReceiptPage({ 
    params, 
    searchParams 
}: { 
    params: Promise<{ recordId: string }>,
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const { recordId } = await params;
  const resolvedSearchParams = await searchParams;
  
  const withdrawnBags = Number(resolvedSearchParams?.withdrawn) || 0;
  const finalRent = Number(resolvedSearchParams?.rent) || 0;
  const paidNow = Number(resolvedSearchParams?.paidNow) || 0;

  const [record, warehouse] = await Promise.all([
    getStorageRecord(recordId),
    getWarehouseDetails()
  ]);
  
  const customer = record ? await getCustomer(record.customerId) : null;

  if (!record || !customer) {
    notFound();
  }
  
  return (
    <AppLayout>
      <PageHeader
        title="Outflow Receipt"
        description={`Final bill for storage record ${record.id}`}
      />
      <div className="flex justify-center">
        <OutflowReceipt 
            record={record} 
            customer={customer}
            withdrawnBags={withdrawnBags}
            finalRent={finalRent}
            paidNow={paidNow}
            warehouse={warehouse}
        />
      </div>
    </AppLayout>
  );
}
