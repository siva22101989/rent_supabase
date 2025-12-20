import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Building2, Users, Wheat, Database, Activity, LayoutDashboard, BarChart3, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
    <div className="min-h-screen bg-slate-50/50 font-sans text-slate-900">
        {/* Header */}
        <header className="sticky top-0 z-30 w-full border-b bg-white/80 backdrop-blur-md">
            <div className="container flex h-16 items-center justify-between px-4 md:px-8">
                 <div className="flex items-center gap-3">
                    <div className="bg-indigo-600 p-2 rounded-lg text-white">
                        <Database className="h-5 w-5" />
                    </div>
                    <div>
                        <h1 className="font-bold text-lg tracking-tight">MAINFRAME</h1>
                        <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold leading-none">Super Admin Console</p>
                    </div>
                 </div>
                 <div className="flex items-center gap-3">
                    <Button size="sm" variant="outline" className="hidden md:flex gap-2">
                        <Settings className="h-4 w-4" /> System Settings
                    </Button>
                    <Button size="sm" variant="ghost" asChild>
                        <Link href="/">Exit to App</Link>
                    </Button>
                 </div>
            </div>
        </header>

        <main className="container py-6 px-4 md:px-8 space-y-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-slate-800">Platform Overview</h2>
                    <p className="text-slate-500">Managing {stats.warehouseCount} warehouses with {stats.usersCount} active users.</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button className="bg-indigo-600 hover:bg-indigo-700">Create New Warehouse</Button>
                </div>
            </div>

            <AdminStatsCards stats={stats} />

            <Tabs defaultValue="warehouses" className="space-y-6">
                <div className="flex items-center justify-between overflow-x-auto pb-2 border-b">
                    <TabsList className="bg-transparent h-auto p-0 gap-6">
                        <TabsTrigger value="warehouses" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-indigo-600 border-b-2 border-transparent rounded-none px-2 py-3 h-auto font-semibold">
                            <Building2 className="mr-2 h-4 w-4" /> Warehouses
                        </TabsTrigger>
                        <TabsTrigger value="users" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-indigo-600 border-b-2 border-transparent rounded-none px-2 py-3 h-auto font-semibold">
                            <Users className="mr-2 h-4 w-4" /> Users
                        </TabsTrigger>
                        <TabsTrigger value="activity" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-indigo-600 border-b-2 border-transparent rounded-none px-2 py-3 h-auto font-semibold">
                            <Activity className="mr-2 h-4 w-4" /> Activity Feed
                        </TabsTrigger>
                        <TabsTrigger value="analytics" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-indigo-600 border-b-2 border-transparent rounded-none px-2 py-3 h-auto font-semibold">
                            <BarChart3 className="mr-2 h-4 w-4" /> Analytics
                        </TabsTrigger>
                    </TabsList>
                </div>

                <TabsContent value="warehouses" className="mt-0 space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold">Platform Warehouses</h3>
                        <div className="flex gap-2">
                            <Button variant="outline" size="sm">Download CSV</Button>
                        </div>
                    </div>
                    <AdminWarehousesTable warehouses={warehouses} />
                </TabsContent>

                <TabsContent value="users" className="mt-0 space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold">User Directory</h3>
                        <div className="flex gap-2">
                            <Button variant="outline" size="sm">Export Users</Button>
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
        </main>
    </div>
  );
}

