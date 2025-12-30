import { PageHeader } from "@/components/shared/page-header";
import { InflowForm } from "@/components/inflow/inflow-form";
import { AddCustomerDialog } from "@/components/customers/add-customer-dialog";
import { getRecentInflows } from "@/lib/queries";
import { isSMSEnabled } from "@/lib/sms-settings-actions";
import { InflowManager } from "./inflow-manager";
import { UnloadingForm } from "@/components/inflow/unloading-form";
import { UnloadedInventory } from "@/components/inflow/unloaded-inventory";
import { getUnloadedInventory } from "@/lib/unloading-actions";
import { createClient } from "@/utils/supabase/server";
import { getUserWarehouse } from "@/lib/queries/warehouses";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
    const { data: customers } = await supabase
        .from('customers')
        .select('id, name')
        .eq('warehouse_id', warehouseId)
        .order('name');
    
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
      
      <Tabs defaultValue="inflow" className="space-y-6">
        <TabsList>
          <TabsTrigger value="inflow">Plot/Quick Inflow</TabsTrigger>
          <TabsTrigger value="arrivals">Truck Arrivals</TabsTrigger>
        </TabsList>
 
        <TabsContent value="arrivals" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <UnloadingForm 
              customers={customers || []} 
              crops={crops || []} 
            />
            <UnloadedInventory 
              records={unloadedRecords as any} 
            />
          </div>
        </TabsContent>
 
        <TabsContent value="inflow">
          <InflowManager 
            initialInflows={records} 
            nextSerialNumber={nextSerialNumber} 
            smsEnabledDefault={smsEnabled} 
            customers={customers || []}
            crops={crops || []}
            lots={lots || []}
            unloadedRecords={unloadedRecords || []}
          />
        </TabsContent>
      </Tabs>
    </>
  );
}
