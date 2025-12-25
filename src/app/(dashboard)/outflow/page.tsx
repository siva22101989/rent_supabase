import { PageHeader } from "@/components/shared/page-header";
import { OutflowForm } from "@/components/outflow/outflow-form";
import { getRecentOutflows } from "@/lib/queries";
import { OutflowListClient } from "./outflow-list-client";

export const dynamic = 'force-dynamic';

export default async function OutflowPage() {
  const recentOutflows = await getRecentOutflows(100); // Fetch more for filtering
  
  return (
    <>
      <PageHeader
        title="Process Outflow"
        description="Select a record to process for withdrawal and generate a final bill."
        breadcrumbs={[
          { label: 'Dashboard', href: '/' },
          { label: 'Outflow' }
        ]}
      />
      <OutflowForm records={[]} />

      {/* Recent Withdrawals with Search/Filter */}
      <OutflowListClient outflows={recentOutflows} />
    </>
  );
}
