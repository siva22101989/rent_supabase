
import { AppLayout } from "@/components/layout/app-layout";
import { PageHeader } from "@/components/shared/page-header";
import { InflowReceipt } from "@/components/inflow/inflow-receipt";
import { storageRecords as getStorageRecords, customers as getCustomers } from "@/lib/data";
import { notFound } from "next/navigation";

export default async function InflowReceiptPage({ params: { recordId } }: { params: { recordId: string } }) {
  const allRecords = await getStorageRecords();
  const allCustomers = await getCustomers();
  const record = allRecords.find(r => r.id === recordId);

  if (!record) {
    notFound();
  }

  const customer = allCustomers.find(c => c.id === record.customerId);

  if (!customer) {
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
