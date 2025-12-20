
import { createClient } from '@/utils/supabase/server';
export const dynamic = 'force-dynamic';
import { getUserWarehouse } from '@/lib/queries';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProfileSettingsTab } from "@/components/settings/profile-settings-tab";
import { WarehouseSettingsTab } from "@/components/settings/warehouse-settings-tab";
import { CropSettingsTab } from "@/components/settings/crop-settings-tab";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { DataManagementTab } from "@/components/settings/data-management-tab";
import { User, Warehouse, Wheat, Users, Database } from "lucide-react";

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
    <div className="flex flex-col gap-8 max-w-5xl mx-auto w-full pb-10">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
            <p className="text-muted-foreground">Manage your account, warehouse preferences, and crop configurations.</p>
        </div>
        <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" asChild className="gap-2">
                <Link href="/settings/team">
                    <Users className="w-4 h-4" />
                    Manage Team
                </Link>
            </Button>
        </div>
      </div>
      
      <Separator />

      <Tabs defaultValue="profile" className="w-full">
        {/* Segmented Control Style Tabs */}
        <TabsList className="w-full flex h-auto p-1 bg-muted/40 rounded-xl mb-8 border items-stretch justify-start overflow-x-auto no-scrollbar">
            <TabsTrigger 
                value="profile" 
                className="flex-1 min-w-[140px] flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:text-primary"
            >
                <User className="w-4 h-4" />
                Profile
            </TabsTrigger>
            <TabsTrigger 
                value="warehouse" 
                className="flex-1 min-w-[140px] flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:text-primary"
            >
                <Warehouse className="w-4 h-4" />
                Warehouse
            </TabsTrigger>
            <TabsTrigger 
                value="crops" 
                className="flex-1 min-w-[140px] flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:text-primary"
            >
                <Wheat className="w-4 h-4" />
                Crops & Rates
            </TabsTrigger>
            <TabsTrigger 
                value="data" 
                className="flex-1 min-w-[140px] flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:text-primary"
            >
                <Database className="w-4 h-4" />
                Data
            </TabsTrigger>
        </TabsList>
        
        <TabsContent value="profile" className="space-y-4 animate-in fade-in-50 duration-300 slide-in-from-left-2">
            <div className="grid gap-4">
                <ProfileSettingsTab profile={profile} />
            </div>
        </TabsContent>
        
        <TabsContent value="warehouse" className="space-y-4 animate-in fade-in-50 duration-300 slide-in-from-left-2">
            <WarehouseSettingsTab warehouse={warehouse} />
        </TabsContent>
        
        <TabsContent value="crops" className="space-y-4 animate-in fade-in-50 duration-300 slide-in-from-left-2">
            <CropSettingsTab crops={crops || []} />
        </TabsContent>

        <TabsContent value="data" className="space-y-4 animate-in fade-in-50 duration-300 slide-in-from-left-2">
            <DataManagementTab />
        </TabsContent>
      </Tabs>
      
    </div>
    </>
  );
}
