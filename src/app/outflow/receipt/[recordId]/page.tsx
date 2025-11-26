
import { AppLayout } from "@/components/layout/app-layout";
import { PageHeader } from "@/components/shared/page-header";
import { OutflowReceipt } from "@/components/outflow/outflow-receipt";
import { storageRecords as getStorageRecords, customers as getCustomers } from "@/lib/data";
import { notFound } from "next/navigation";

type OutflowReceiptPageProps = {
  params: { recordId: string };
  searchParams: { [key: string]: string | string[] | undefined };
};

export default async function OutflowReceiptPage({ params, searchParams }: OutflowReceiptPageProps) {
  const { recordId } = params;
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

  const withdrawnBags = Number(searchParams.withdrawn) || 0;
  const finalRent = Number(searchParams.rent) || 0;
  
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
        />
      </div>
    </AppLayout>
  );
}
