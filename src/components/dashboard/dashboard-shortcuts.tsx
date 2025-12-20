'use client';

import { useLayout } from "@/components/providers/layout-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { ArrowDownToDot, ArrowUpFromDot, Warehouse, CreditCard, Users, FileText, IndianRupee } from "lucide-react";

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

export function DashboardShortcuts() {
  const { isSidebarMode } = useLayout();

  // If sidebar is active, hide these redundant shortcuts
  if (isSidebarMode) {
    return null;
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
      {navItems.map((item) => (
        <NavCard key={item.href} item={item} />
      ))}
    </div>
  );
}
