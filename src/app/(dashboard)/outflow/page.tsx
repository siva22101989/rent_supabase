import { PageHeader } from "@/components/shared/page-header";
import { OutflowForm } from "@/components/outflow/outflow-form";
import { getRecentOutflows } from "@/lib/queries";
import { OutflowManager } from "./outflow-manager";

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
      
      <OutflowManager initialOutflows={recentOutflows} />
    </>
  );
}
