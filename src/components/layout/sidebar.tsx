'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { 
    LayoutDashboard, 
    Truck, 
    ArrowRight, 
    Users, 
    Wallet, 
    BarChart3, 
    Settings,
    HelpCircle,
    Package,
    ChevronLeft,
    IndianRupee,
    CreditCard
} from 'lucide-react';
import { Logo } from '@/components/layout/logo';
import { navItems, bottomItems } from '@/config/nav';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  userRole?: string;
}

export function Sidebar({ collapsed, onToggle, userRole }: SidebarProps) {
  const pathname = usePathname();

  const filteredNavItems = navItems.filter(item => {
    if (!item.roles) return true;
    return item.roles.includes(userRole as any);
  });

  const filteredBottomItems = bottomItems.filter(item => {
    if ((item as any).roles) return (item as any).roles.includes(userRole);
    return true;
  });


  const NavLink = ({ item }: { item: typeof navItems[0] }) => {
      const isActive = item.href === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(item.href);
      return (
          <Button
            variant={isActive ? "secondary" : "ghost"}
            className={cn(
                "w-full justify-start gap-3 mb-1",
                collapsed ? "justify-center px-0" : "px-4"
            )}
            asChild
          >
            <Link href={item.href} prefetch={true}>
                <item.icon className="h-4 w-4 shrink-0" />
                {!collapsed && <span>{item.label}</span>}
            </Link>
          </Button>
      );
  };

  return (
    <aside 
        className={cn(
            "hidden md:flex flex-col border-r bg-card shadow-sm transition-all duration-300 h-screen sticky top-0",
            collapsed ? "w-16" : "w-64"
        )}
    >
      <div className="h-16 flex items-center px-4 border-b justify-between">
         {!collapsed && <Logo href="/dashboard" />}
         {collapsed && (
            <Button variant="ghost" size="icon" onClick={onToggle} className="mx-auto h-8 w-8 rounded-full">
                <ArrowRight className="h-4 w-4" />
            </Button>
         )}
         
         {!collapsed && (
            <Button variant="ghost" size="icon" onClick={onToggle} className="h-6 w-6 rounded-full">
                <ChevronLeft className="h-3 w-3" />
            </Button>
         )}
      </div>

      <div className="flex-1 overflow-y-auto py-4 px-2">
         {filteredNavItems.map((item) => <NavLink key={item.href} item={item} />)}
      </div>

      <div className="p-2 border-t space-y-1">
         {filteredBottomItems.map((item) => <NavLink key={item.href} item={item} />)}
         
         {collapsed && (
             <Button variant="ghost" size="icon" onClick={onToggle} className="w-full mt-2">
                 <ArrowRight className="h-4 w-4" />
             </Button>
         )}
      </div>
    </aside>
  );
}
