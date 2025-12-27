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
// import { GlobalActivityFeed } from '@/components/admin/activity-feed'; // Replaced
import { ActivityLogsTable } from '@/components/admin/activity-logs-table';
import { PlatformAnalyticsCharts } from '@/components/admin/analytics-charts';
import { getAdminAllSubscriptions, getAllPlans } from '@/lib/subscription-actions';
import { SubscriptionsTable } from '@/components/admin/subscriptions-table';
import { CreditCard } from 'lucide-react';
export default async function SuperAdminDashboard({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const params = await searchParams;
  const q = typeof params.q === 'string' ? params.q : '';
  const page = typeof params.page === 'string' ? Number(params.page) : 1;
  const type = typeof params.type === 'string' ? params.type : '';
  
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

  if (profile?.role !== 'super_admin' && profile?.role !== 'owner') {
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
  const analyticsData = await getPlatformAnalytics();
  
  // Fetch Subscription Data
  const subscriptions = await getAdminAllSubscriptions();
  const plans = await getAllPlans();

  // Fetch Logs with Filters
  const limit = 50;
  const offset = (page - 1) * limit;
  const activityLogs = await getGlobalActivityLogs(limit, offset, q, type);

  if (!stats) return <div>Failed to load stats</div>;

  return (
    <div className="max-w-7xl mx-auto w-full space-y-6 sm:space-y-8">
      <PageHeader
        title="Admin Panel"
        description={`Managing ${stats.warehouseCount} warehouses with ${stats.usersCount} active users.`}
        breadcrumbs={[
          { label: 'Dashboard', href: '/' },
          { label: 'Admin Panel' }
        ]}
      >
        <Button className="bg-indigo-600 hover:bg-indigo-700 shadow-sm gap-2">
          <Database className="h-4 w-4" />
          <span className="hidden xs:inline">Create Warehouse</span>
          <span className="xs:hidden">Create</span>
        </Button>
      </PageHeader>

      <AdminStatsCards stats={stats} />

      <Tabs defaultValue="warehouses" className="space-y-4 sm:space-y-6 overflow-hidden">
        <div className="flex items-center justify-between overflow-x-auto pb-1 no-scrollbar border-b border-primary/10 -mx-4 px-4 sm:mx-0 sm:px-0">
          <TabsList className="bg-transparent h-auto p-0 gap-6 justify-start">
            <TabsTrigger 
              value="warehouses" 
              className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-indigo-600 border-b-2 border-transparent rounded-none px-1 py-3 h-auto font-semibold text-sm whitespace-nowrap"
            >
              <Building2 className="mr-2 h-4 w-4" /> 
              Warehouses
            </TabsTrigger>
            <TabsTrigger 
              value="users" 
              className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-indigo-600 border-b-2 border-transparent rounded-none px-1 py-3 h-auto font-semibold text-sm whitespace-nowrap"
            >
              <Users className="mr-2 h-4 w-4" /> Users
            </TabsTrigger>
            <TabsTrigger 
              value="activity" 
              className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-indigo-600 border-b-2 border-transparent rounded-none px-1 py-3 h-auto font-semibold text-sm whitespace-nowrap"
            >
              <Activity className="mr-2 h-4 w-4" /> Audit Logs
            </TabsTrigger>
            <TabsTrigger 
              value="analytics" 
              className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-indigo-600 border-b-2 border-transparent rounded-none px-1 py-3 h-auto font-semibold text-sm whitespace-nowrap"
            >
              <BarChart3 className="mr-2 h-4 w-4" /> Analytics
            </TabsTrigger>
            <TabsTrigger 
              value="subscriptions" 
              className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-indigo-600 border-b-2 border-transparent rounded-none px-1 py-3 h-auto font-semibold text-sm whitespace-nowrap"
            >
              <CreditCard className="mr-2 h-4 w-4" /> Subscriptions
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="warehouses" className="mt-0 space-y-4 pt-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold tracking-tight">Platform Warehouses</h3>
          </div>
          <AdminWarehousesTable warehouses={warehouses} />
        </TabsContent>

        <TabsContent value="users" className="mt-0 space-y-4 pt-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold tracking-tight">User Directory</h3>
          </div>
          <AdminUsersTable users={users} />
        </TabsContent>

        <TabsContent value="activity" className="mt-0 pt-4">
          <Card className="border-none shadow-none bg-transparent">
            <div className="mb-4">
              <h3 className="text-lg font-semibold tracking-tight">Global Audit Log</h3>
              <p className="text-sm text-muted-foreground">Latest actions from all users across the platform.</p>
            </div>
            <ActivityLogsTable logs={activityLogs} />
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="mt-0 pt-4">
          <PlatformAnalyticsCharts data={analyticsData} />
        </TabsContent>

        <TabsContent value="subscriptions" className="mt-0 pt-4">
             <div className="mb-4">
              <h3 className="text-lg font-semibold tracking-tight">Subscription Management</h3>
              <p className="text-sm text-muted-foreground">Manually manage warehouse plans and expiry dates.</p>
            </div>
            <SubscriptionsTable initialData={subscriptions} plans={plans} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

