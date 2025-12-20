
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export const dynamic = 'force-dynamic';
import { getDashboardMetrics, getAvailableLots } from "@/lib/queries";
import { Progress } from "@/components/ui/progress";
import { DashboardCharts } from "@/components/dashboard/dashboard-charts";
import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import { DashboardShortcuts } from "@/components/dashboard/dashboard-shortcuts";

import { JoinWarehouseForm } from '@/components/onboarding/join-warehouse-form';

export default async function DashboardPage() {
  const metrics = await getDashboardMetrics();
  
  // If no warehouse metrics, this user might be a Customer or New User
  if (!metrics) {
      // FIX: Check if they are an Admin/Manager first.
      // If they are Admin/Manager but have no warehouse, they should see "Create Warehouse" UI, not Portal.
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      let role = 'customer';
      if (user) {
          const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
          if (profile) role = profile.role;
      }

      // 1. Customer -> Portal
      if (role === 'customer') {
        redirect('/portal');
      }

      // 2. Staff -> Join Warehouse Screen
      if (role === 'staff') {
          return (
                  <JoinWarehouseForm />
          );
      }
      
      // 3. Admin/Manager -> Falls through to AppLayout which handles Onboarding (Create Warehouse)
      // or renders empty dashboard if Onboarding logic fails (but AppLayout logic is robust now).
  }

  const lots = await getAvailableLots();

  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Overview of your warehouse operations."
      />
      

      <DashboardShortcuts />

       {/* Lot Utilization Grid */}
       <div className="mb-8">
        <h3 className="text-lg font-medium mb-4">Lot Utilization</h3>
        <div className="rounded-md border p-4 max-h-[500px] overflow-y-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {lots && lots.map((lot: any) => {
                const capacity = lot.capacity || 1000;
                const current = lot.current_stock || 0;
                const percentage = (current / capacity) * 100;
                let colorClass = "bg-green-500";
                if (percentage > 75) colorClass = "bg-red-500";
                else if (percentage > 50) colorClass = "bg-yellow-500";

                return (
                    <Card key={lot.id} className="overflow-hidden">
                        <div className={`h-2 w-full ${colorClass}`} />
                        <CardContent className="p-4">
                            <div className="font-semibold">{lot.name}</div>
                            <div className="text-xs text-muted-foreground mt-1">
                                {current} / {capacity}
                            </div>
                            <Progress value={percentage} className="h-1 mt-2" />
                        </CardContent>
                    </Card>
                )
            })}
             {(!lots || lots.length === 0) && (
                <div className="col-span-full text-center text-muted-foreground py-8">
                    No lots configured. Go to Settings &gt; Lots to add them.
                </div>
            )}
        </div>
        </div>
       </div>

      {/* Metrics Section (Moved) */}
      <DashboardCharts metrics={metrics} />
    </>
  );
}
