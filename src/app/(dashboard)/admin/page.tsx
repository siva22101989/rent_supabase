import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Building2, Users, Wheat, Database, Activity, LayoutDashboard, BarChart3, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/shared/page-header";
import { 
    getAdminDashboardStats, 
    getAllWarehousesAdmin, 
    getAllUsersAdmin, 
    getGlobalActivityLogs,
    getPlatformAnalytics
} from '@/lib/queries';

import { AdminStatsCards } from '@/components/admin/stats-cards';
import { AdminWarehousesTable } from '@/components/admin/warehouses-table';
import { AdminUsersTable } from '@/components/admin/users-table';
import { GlobalActivityFeed } from '@/components/admin/activity-feed';
import { PlatformAnalyticsCharts } from '@/components/admin/analytics-charts';

export default async function SuperAdminDashboard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect('/login');
  }

  // 1. Strict Role Check
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'super_admin') {
      return (
        <div className="flex h-screen w-full flex-col items-center justify-center gap-4 bg-slate-50">
            <h1 className="text-4xl font-bold text-slate-800">403 Forbidden</h1>
            <p className="text-slate-600">You do not have permission to access the Mainframe.</p>
            <Button asChild variant="outline">
                <Link href="/">Return to Dashboard</Link>
            </Button>
        </div>
      );
  }

  // 2. Fetch Initial Platform Data
  const stats = await getAdminDashboardStats();
  const warehouses = await getAllWarehousesAdmin();
  const users = await getAllUsersAdmin();
  const activityLogs = await getGlobalActivityLogs(20);
  const analyticsData = await getPlatformAnalytics();

  if (!stats) return <div>Failed to load stats</div>;

  return (
    <>
      <PageHeader
        title="Admin Panel"
        description={`Managing ${stats.warehouseCount} warehouses with ${stats.usersCount} active users.`}
        breadcrumbs={[
          { label: 'Dashboard', href: '/' },
          { label: 'Admin Panel' }
        ]}
      >
        <Button className="bg-indigo-600 hover:bg-indigo-700">
          <Database className="h-4 w-4 mr-2" />
          Create Warehouse
        </Button>
      </PageHeader>

            <AdminStatsCards stats={stats} />

            <Tabs defaultValue="warehouses" className="space-y-4 sm:space-y-6">
                <div className="flex items-center justify-between overflow-x-auto pb-2 border-b">
                    <TabsList className="bg-transparent h-auto p-0 gap-3 sm:gap-6 w-full sm:w-auto justify-start">
                        <TabsTrigger 
                            value="warehouses" 
                            className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-indigo-600 border-b-2 border-transparent rounded-none px-2 py-2.5 sm:py-3 h-auto font-semibold text-xs sm:text-sm whitespace-nowrap"
                        >
                            <Building2 className="mr-1.5 sm:mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" /> 
                            Warehouses
                        </TabsTrigger>
                        <TabsTrigger 
                            value="users" 
                            className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-indigo-600 border-b-2 border-transparent rounded-none px-2 py-2.5 sm:py-3 h-auto font-semibold text-xs sm:text-sm whitespace-nowrap"
                        >
                            <Users className="mr-1.5 sm:mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" /> Users
                        </TabsTrigger>
                        <TabsTrigger 
                            value="activity" 
                            className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-indigo-600 border-b-2 border-transparent rounded-none px-2 py-2.5 sm:py-3 h-auto font-semibold text-xs sm:text-sm whitespace-nowrap"
                        >
                            <Activity className="mr-1.5 sm:mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" /> Activity
                        </TabsTrigger>
                        <TabsTrigger 
                            value="analytics" 
                            className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-indigo-600 border-b-2 border-transparent rounded-none px-2 py-2.5 sm:py-3 h-auto font-semibold text-xs sm:text-sm whitespace-nowrap"
                        >
                            <BarChart3 className="mr-1.5 sm:mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" /> Analytics
                        </TabsTrigger>
                    </TabsList>
                </div>

                <TabsContent value="warehouses" className="mt-0 space-y-4">
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                        <h3 className="text-base sm:text-lg font-semibold">Platform Warehouses</h3>
                        <div className="flex gap-2">
                            <Button variant="outline" size="sm" className="flex-1 sm:flex-none text-xs sm:text-sm">Download CSV</Button>
                        </div>
                    </div>
                    <AdminWarehousesTable warehouses={warehouses} />
                </TabsContent>

                <TabsContent value="users" className="mt-0 space-y-4">
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                        <h3 className="text-base sm:text-lg font-semibold">User Directory</h3>
                        <div className="flex gap-2">
                            <Button variant="outline" size="sm" className="flex-1 sm:flex-none text-xs sm:text-sm">Export Users</Button>
                        </div>
                    </div>
                    <AdminUsersTable users={users} />
                </TabsContent>

                <TabsContent value="activity" className="mt-0">
                    <Card>
                        <CardHeader>
                            <CardTitle>Global Audit Log</CardTitle>
                            <CardDescription>Latest actions from all users across the platform.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <GlobalActivityFeed logs={activityLogs} />
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="analytics" className="mt-0">
                    <PlatformAnalyticsCharts data={analyticsData} />
                </TabsContent>
            </Tabs>
    </>
  );
}

