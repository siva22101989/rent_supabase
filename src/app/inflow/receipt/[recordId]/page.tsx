import { AppLayout } from "@/components/layout/app-layout";
import { PageHeader } from "@/components/shared/page-header";
import { InflowReceipt } from "@/components/inflow/inflow-receipt";
import { getStorageRecord, getCustomer } from "@/lib/queries";
import { notFound } from "next/navigation";

export const dynamic = 'force-dynamic';

export default async function InflowReceiptPage({ params }: { params: Promise<{ recordId: string }> }) {
  const { recordId } = await params;
  
  const record = await getStorageRecord(recordId);
  const customer = record ? await getCustomer(record.customerId) : null;

  if (!record || !customer) {
    notFound();
  }
  
  return (
    <AppLayout>
      <PageHeader
        title="Inflow Receipt"
        description={`Details for storage record ${record.id}`}
      />
      <div className="flex justify-center">
        <InflowReceipt record={record} customer={customer} />
      </div>
    </AppLayout>
  );
}
