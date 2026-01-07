import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

// Revalidate every 30 seconds for fresh dashboard data
export const revalidate = 30;
import { getDashboardMetrics, getAvailableLots, getWarehouseDetails, getRecentInflows, getRecentOutflows } from "@/lib/queries";
import { Progress } from "@/components/ui/progress";
// import { DashboardCharts } from "@/components/dashboard/dashboard-charts"; // Replaced by new Stats
import { DashboardStats } from "@/components/dashboard/dashboard-stats";
// import { QuickActions } from "@/components/dashboard/quick-actions";
import { DashboardHero } from "@/components/dashboard/dashboard-hero";
import { RecentActivity } from "@/components/dashboard/recent-activity";
import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import { DashboardShortcuts } from "@/components/dashboard/dashboard-shortcuts"; 
import { JoinWarehouseForm } from '@/components/onboarding/join-warehouse-form';
import { MarketPricesWidgetWrapper } from '@/components/market-prices/price-widget-wrapper';

export default async function DashboardPage() {
  const [metrics, warehouse, recentInflows, recentOutflows] = await Promise.all([
    getDashboardMetrics(),
    getWarehouseDetails(),
    getRecentInflows(5),
    getRecentOutflows(5)
  ]);

  // Merge and sort activities
  const activities = [
    ...(recentInflows || []).map((i: any) => ({ ...i, type: 'inflow', invoiceNo: i.recordNumber || i.id.slice(0, 8) })),
    ...(recentOutflows || []).map((o: any) => ({ ...o, type: 'outflow' }))
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
   .slice(0, 5); // Top 5 recent events
  
  // If no warehouse metrics/details, this user might be a Customer or New User
  if (!metrics || !warehouse) {
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

  // const lots = await getAvailableLots(); // We moved this to /settings/lots

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* 1. Hero Section */}
      <DashboardHero 
        warehouseName={warehouse?.name || 'My Warehouse'} 
        totalStock={metrics?.totalStock || 0}
        capacity={metrics?.totalCapacity || 1000}
        activeRecords={metrics?.activeRecordsCount || 0}
      />

      <DashboardShortcuts />

      {/* 2. Metric Cards (Enhanced) */}
      <div className="relative">
          <div className="absolute inset-0 flex items-center" aria-hidden="true">
            <div className="w-full border-t border-dashed border-gray-200" />
          </div>
          <div className="relative flex justify-center">
            <span className="bg-background px-3 text-sm text-muted-foreground">Overview</span>
          </div>
      </div>
      <DashboardStats metrics={metrics} />

      {/* 3. Market Prices Widget */}
      <MarketPricesWidgetWrapper warehouseId={warehouse?.id} />

      {/* 4. Recent Activity */}
      <RecentActivity activities={activities as any} />
      
    </div>
  );
}
