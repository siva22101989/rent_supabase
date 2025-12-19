
import { AppLayout } from "@/components/layout/app-layout";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export const dynamic = 'force-dynamic';
import { ArrowRight, Users, FileText, IndianRupee, ArrowDownToDot, ArrowUpFromDot, Warehouse, CreditCard } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { getDashboardMetrics, getAvailableLots } from "@/lib/queries";
import { Progress } from "@/components/ui/progress";
import { DashboardCharts } from "@/components/dashboard/dashboard-charts";
import { redirect } from 'next/navigation';
import { getCustomerPortfolio } from '@/lib/portal-queries'; 

type NavItem = {
  href: string;
  label: string;
  description: string;
  icon: LucideIcon;
};

const navItems: NavItem[] = [
  { href: '/inflow', label: 'Inflow', description: 'Add new items to storage.', icon: ArrowDownToDot },
  { href: '/outflow', label: 'Outflow', description: 'Process item withdrawals.', icon: ArrowUpFromDot },
  { href: '/storage', label: 'Storage', description: 'View all active storage.', icon: Warehouse },
  { href: '/payments/pending', label: 'Payments', description: 'Manage pending payments.', icon: IndianRupee },
  { href: '/customers', label: 'Customers', description: 'View and manage customers.', icon: Users },
  { href: '/reports', label: 'Reports', description: 'See all transactions.', icon: FileText },
  { href: '/expenses', label: 'Expenses', description: 'Track and manage expenses.', icon: CreditCard },
];

function NavCard({ item }: { item: NavItem }) {
  return (
    <Card className="relative overflow-hidden group transition-all
                     bg-card border-border/50 shadow-sm
                     dark:border-border/30 dark:shadow-lg dark:shadow-primary/5
                     hover:shadow-md dark:hover:shadow-xl dark:hover:shadow-primary/10">
      {/* Gradient overlay on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent
                      dark:from-primary/10 dark:to-transparent
                      opacity-0 group-hover:opacity-100 transition-opacity" />
      
      <CardHeader className="flex flex-row items-center justify-between pb-2 relative z-10">
        <CardTitle className="text-base md:text-lg font-medium">{item.label}</CardTitle>
        <item.icon className="h-5 w-5 md:h-6 md:w-6 text-muted-foreground group-hover:text-primary transition-colors" />
      </CardHeader>
      <CardContent className="relative z-10">
        <p className="text-sm text-muted-foreground mb-4">{item.description}</p>
        <Button asChild size="sm" className="w-full md:w-auto shadow-sm hover:shadow-md transition-all min-h-[44px]">
          <Link href={item.href}>
            Go to {item.label}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}

export default async function DashboardPage() {
  const metrics = await getDashboardMetrics();
  
  // If no warehouse metrics, this user might be a Customer or New User
  if (!metrics) {
      // Check if they are a Portal User
      const portfolio = await getCustomerPortfolio();
      if (portfolio && portfolio.length > 0) {
          redirect('/portal');
      }
  }

  const lots = await getAvailableLots();

  return (
    <AppLayout>
      <PageHeader
        title="Dashboard"
        description="Overview of your warehouse operations."
      />
      


      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
        {navItems.map((item) => (
          <NavCard key={item.href} item={item} />
        ))}
      </div>

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
    </AppLayout>
  );
}
