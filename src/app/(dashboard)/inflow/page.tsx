import { PageHeader } from "@/components/shared/page-header";
import { AddCustomerDialog } from "@/components/customers/add-customer-dialog";
import { getRecentInflows } from "@/lib/queries";
import { isSMSEnabled } from "@/lib/sms-settings-actions";
import { getUnloadedInventory } from "@/lib/unloading-actions";
import { createClient } from "@/utils/supabase/server";
import { getUserWarehouse } from "@/lib/queries/warehouses";
import { InflowDashboard } from "./inflow-dashboard";

export const dynamic = 'force-dynamic';

export default async function InflowPage() {
    const records = await getRecentInflows(100);
    const nextSerialNumber = "Auto-Generated";
    const smsEnabled = await isSMSEnabled('inflow_welcome');
    
    // Fetch data for unloading tracker
    const unloadedRecords = await getUnloadedInventory();
    const supabase = await createClient();
    const warehouseId = await getUserWarehouse();
    
    // Fetch customers, crops, and lots
    const { data: customersRaw } = await supabase
        .from('customers')
        .select('id, name, father_name, village')
        .eq('warehouse_id', warehouseId)
        .order('name');
    
    const customers = (customersRaw || []).map((c: any) => ({
        id: c.id,
        name: c.name,
        fatherName: c.father_name || '',
        village: c.village || ''
    }));
    
    const { data: crops } = await supabase
        .from('crops')
        .select('id, name')
        .eq('warehouse_id', warehouseId)
        .order('name');

    const { data: lots } = await supabase
        .from('lots')
        .select('id, name, capacity, current_bags, commodity_description')
        .eq('warehouse_id', warehouseId)
        .eq('status', 'active');

  return (
    <>
      <PageHeader
        title="Inflow Management"
        description="Record truck arrivals and manage storage inflows."
        breadcrumbs={[
          { label: 'Dashboard', href: '/' },
          { label: 'Inflow' }
        ]}
      >
        <AddCustomerDialog />
      </PageHeader>
      
      <InflowDashboard 
          initialInflows={records}
          nextSerialNumber={nextSerialNumber}
          smsEnabled={smsEnabled}
          customers={customers || []}
          crops={crops || []}
          lots={lots || []}
          unloadedRecords={unloadedRecords}
      />
    </>
  );
}
