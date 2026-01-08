import { PageHeader } from "@/components/shared/page-header";
import { OutflowForm } from "@/components/outflow/outflow-form";
import { getRecentOutflows } from "@/lib/queries";
import { isSMSEnabled } from "@/lib/sms-settings-actions";
import { OutflowManager } from "./outflow-manager";


export const revalidate = 30; // 30 seconds for high-frequency updates

export default async function OutflowPage() {
  const recentOutflows = await getRecentOutflows(100); // Fetch more for filtering
  const smsEnabled = await isSMSEnabled('outflow_confirmation');
  
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
      
      <OutflowManager initialOutflows={recentOutflows} smsEnabledDefault={smsEnabled} />
    </>
  );
}
