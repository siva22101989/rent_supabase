
import { createClient } from '@/utils/supabase/server';
export const dynamic = 'force-dynamic';
import { getUserWarehouse } from '@/lib/queries';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProfileSettingsTab } from "@/components/settings/profile-settings-tab";
import { WarehouseSettingsTab } from "@/components/settings/warehouse-settings-tab";
import { CropSettingsTab } from "@/components/settings/crop-settings-tab";
import { Button } from "@/components/ui/button";
import { DataManagementTab } from "@/components/settings/data-management-tab";
import { SMSSettingsCard } from "@/components/settings/sms-settings-card";
import { User, Warehouse, Wheat, Users, Database, MessageSquare } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";

export default async function SettingsPage() {
  const warehouseId = await getUserWarehouse();
  if (!warehouseId) {
    redirect('/login');
  }

  const supabase = await createClient();
  
  // Fetch User & Profile
  const { data: { user } } = await supabase.auth.getUser();
  let profile = null;
  if (user) {
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      profile = data;
  }

  // Fetch Warehouse Details
  const { data: warehouse } = await supabase
    .from('warehouses')
    .select('*')
    .eq('id', warehouseId)
    .single();

  // Fetch Crops
  const { data: crops } = await supabase
    .from('crops')
    .select('*')
    .eq('warehouse_id', warehouseId)
    .order('name');

  return (
    <>
      <PageHeader
        title="Settings"
        description="Manage your account, warehouse preferences, and crop configurations."
        breadcrumbs={[
          { label: 'Dashboard', href: '/' },
          { label: 'Settings' }
        ]}
      >
        <Button variant="outline" size="sm" asChild className="gap-2">
          <Link href="/settings/team">
            <Users className="w-4 h-4" />
            <span className="hidden sm:inline">Manage Team</span>
            <span className="sm:hidden">Team</span>
          </Link>
        </Button>
      </PageHeader>

      <div className="-mx-3 md:mx-0">
        <Tabs defaultValue="profile" className="w-full">
          {/* Segmented Control Style Tabs - Full width on mobile */}
          <TabsList className="w-full flex h-auto p-1 bg-muted/40 rounded-xl mb-6 md:mb-8 border items-stretch justify-start overflow-x-auto px-3 md:px-1">
              <TabsTrigger 
                  value="profile" 
                  className="flex-1 min-w-[80px] md:min-w-[140px] flex items-center justify-center gap-2 px-2 md:px-4 py-2.5 rounded-lg font-medium transition-all data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:text-primary text-sm md:text-base"
              >
                  <User className="w-4 h-4" />
                  <span className="whitespace-nowrap">Profile</span>
              </TabsTrigger>
              <TabsTrigger 
                  value="warehouse" 
                  className="flex-1 min-w-[80px] md:min-w-[140px] flex items-center justify-center gap-2 px-2 md:px-4 py-2.5 rounded-lg font-medium transition-all data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:text-primary text-sm md:text-base"
              >
                  <Warehouse className="w-4 h-4" />
                  <span className="whitespace-nowrap">Warehouse</span>
              </TabsTrigger>
              <TabsTrigger 
                  value="crops" 
                  className="flex-1 min-w-[80px] md:min-w-[140px] flex items-center justify-center gap-2 px-2 md:px-4 py-2.5 rounded-lg font-medium transition-all data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:text-primary text-sm md:text-base"
              >
                  <Wheat className="w-4 h-4" />
                  <span className="whitespace-nowrap hidden sm:inline">Crops & Rates</span>
                  <span className="whitespace-nowrap sm:hidden">Crops</span>
              </TabsTrigger>
              <TabsTrigger 
                  value="data" 
                  className="flex-1 min-w-[80px] md:min-w-[140px] flex items-center justify-center gap-2 px-2 md:px-4 py-2.5 rounded-lg font-medium transition-all data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:text-primary text-sm md:text-base"
              >
                  <Database className="w-4 h-4" />
                  <span className="whitespace-nowrap">Data</span>
              </TabsTrigger>
              <TabsTrigger 
                  value="notifications" 
                  className="flex-1 min-w-[80px] md:min-w-[140px] flex items-center justify-center gap-2 px-2 md:px-4 py-2.5 rounded-lg font-medium transition-all data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:text-primary text-sm md:text-base"
              >
                  <MessageSquare className="w-4 h-4" />
                  <span className="whitespace-nowrap">SMS</span>
              </TabsTrigger>
          </TabsList>
          
          <div className="px-3 md:px-0">
            <TabsContent value="profile" className="mt-6 space-y-4 animate-in fade-in-50 duration-300 slide-in-from-left-2">
                <div className="grid gap-4">
                    <ProfileSettingsTab profile={profile} />
                </div>
            </TabsContent>
            
            <TabsContent value="warehouse" className="mt-6 space-y-4 animate-in fade-in-50 duration-300 slide-in-from-left-2">
                <WarehouseSettingsTab warehouse={warehouse} />
            </TabsContent>
            
            <TabsContent value="crops" className="mt-6 space-y-4 animate-in fade-in-50 duration-300 slide-in-from-left-2">
                <CropSettingsTab crops={crops || []} />
            </TabsContent>

            <TabsContent value="data" className="mt-6 space-y-4 animate-in fade-in-50 duration-300 slide-in-from-left-2">
                <DataManagementTab />
            </TabsContent>

            <TabsContent value="notifications" className="mt-6 space-y-4 animate-in fade-in-50 duration-300 slide-in-from-left-2">
                <SMSSettingsCard />
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </>
  );
}
