
import { AppLayout } from "@/components/layout/app-layout";
import { PageHeader } from "@/components/shared/page-header";
import { OutflowForm } from "@/components/outflow/outflow-form";
import { storageRecords as getStorageRecords, customers as getCustomers } from "@/lib/data";

export default async function OutflowPage() {
  const allRecords = await getStorageRecords();
  const allCustomers = await getCustomers();
  const activeRecords = allRecords.filter(r => !r.storageEndDate);

  return (
    <AppLayout>
      <PageHeader
        title="Process Outflow"
        description="Select a record to process for withdrawal and generate a final bill."
      />
      <OutflowForm records={activeRecords} customers={allCustomers} />
    </AppLayout>
  );
}
