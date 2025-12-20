import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, Users, Wheat, Database } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

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

  // 2. Fetch Platform Stats (Allowed by 'Super Admin All' RLS)
  const { count: warehouseCount } = await supabase.from('warehouses').select('*', { count: 'exact', head: true });
  const { count: usersCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
  const { count: customersCount } = await supabase.from('customers').select('*', { count: 'exact', head: true });
  
  // Storage usage?
  const { data: lots } = await supabase.from('warehouse_lots').select('current_stock');
  const totalStock = lots?.reduce((sum, lot) => sum + (lot.current_stock || 0), 0) || 0;

  return (
    <div className="min-h-screen bg-slate-100 font-sans text-slate-900">
        {/* Header */}
        <header className="sticky top-0 z-20 w-full border-b bg-white/80 backdrop-blur">
            <div className="container flex h-16 items-center justify-between px-4">
                 <div className="flex items-center gap-2 font-bold text-xl tracking-tight text-indigo-700">
                    <Database className="h-6 w-6" />
                    <span>MAINFRAME</span>
                 </div>
                 <div className="flex items-center gap-4">
                    <span className="text-sm font-medium text-slate-500">Super Admin Mode</span>
                    <Button size="sm" variant="ghost" asChild>
                        <Link href="/">Exit to App</Link>
                    </Button>
                 </div>
            </div>
        </header>

        <main className="container py-8 px-4 space-y-8">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Platform Overview</h2>
                <p className="text-slate-500">Global statistics across all tenants.</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <StatCard 
                    title="Total Warehouses" 
                    value={warehouseCount || 0} 
                    icon={<Building2 className="h-4 w-4 text-indigo-600" />}
                />
                <StatCard 
                    title="Registered Users" 
                    value={usersCount || 0} 
                    icon={<Users className="h-4 w-4 text-blue-600" />}
                />
                <StatCard 
                    title="Farmers Served" 
                    value={customersCount || 0} 
                    icon={<Users className="h-4 w-4 text-green-600" />}
                />
                <StatCard 
                    title="Total Stock (Bags)" 
                    value={totalStock.toLocaleString()} 
                    icon={<Wheat className="h-4 w-4 text-amber-600" />}
                />
            </div>

            {/* Recent Warehouses List */}
             <Card>
                <CardHeader>
                    <CardTitle>Recent Warehouses</CardTitle>
                </CardHeader>
                <CardContent>
                    <RecentWarehousesList />
                </CardContent>
             </Card>
        </main>
    </div>
  );
}

function StatCard({ title, value, icon }: { title: string, value: string | number, icon: React.ReactNode }) {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{title}</CardTitle>
                {icon}
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{value}</div>
            </CardContent>
        </Card>
    );
}

async function RecentWarehousesList() {
    const supabase = await createClient();
    const { data: warehouses } = await supabase
        .from('warehouses')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

    if (!warehouses || warehouses.length === 0) return <p className="text-sm text-muted-foreground">No warehouses found.</p>;

    return (
        <div className="space-y-4">
            {warehouses.map(w => (
                <div key={w.id} className="flex items-center justify-between border-b last:border-0 pb-2 last:pb-0">
                    <div>
                        <p className="font-medium text-sm">{w.name}</p>
                        <p className="text-xs text-muted-foreground">{w.location}</p>
                    </div>
                    <div className="text-xs text-slate-500">
                        Cap: {w.capacity_bags}
                    </div>
                </div>
            ))}
        </div>
    );
}
