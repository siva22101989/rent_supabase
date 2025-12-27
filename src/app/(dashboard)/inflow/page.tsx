import { PageHeader } from "@/components/shared/page-header";
import { InflowForm } from "@/components/inflow/inflow-form";
import { AddCustomerDialog } from "@/components/customers/add-customer-dialog";
import { getRecentInflows } from "@/lib/queries";
import { InflowManager } from "./inflow-manager";

export const dynamic = 'force-dynamic';

export default async function InflowPage() {
    const records = await getRecentInflows(100); // Fetch more for filtering

  // Removed manual sequence logic as it is now handled server-side
  const nextSerialNumber = "Auto-Generated";

  return (
    <>
      <PageHeader
        title="Add Inflow"
        description="Create a new storage record for a customer."
        breadcrumbs={[
          { label: 'Dashboard', href: '/' },
          { label: 'Inflow' }
        ]}
      >
        <AddCustomerDialog />
      </PageHeader>
      
      <InflowManager initialInflows={records} nextSerialNumber={nextSerialNumber} />
    </>
  );
}
