import { AppLayout } from "@/components/layout/app-layout";
import { PageHeader } from "@/components/shared/page-header";
import { OutflowReceipt } from "@/components/outflow/outflow-receipt";
import { getStorageRecord, getCustomer } from "@/lib/queries";
import { notFound } from "next/navigation";

export const dynamic = 'force-dynamic';

export default async function OutflowReceiptPage({ 
    params, 
    searchParams 
}: { 
    params: { recordId: string },
    searchParams: { [key: string]: string | string[] | undefined }
}) {
  const { recordId } = params;
  
  const withdrawnBags = Number(searchParams?.withdrawn) || 0;
  const finalRent = Number(searchParams?.rent) || 0;
  const paidNow = Number(searchParams?.paidNow) || 0;

  const record = await getStorageRecord(recordId);
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
        />
      </div>
    </AppLayout>
  );
}
