'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetHeader } from '@/components/ui/sheet';
import { Menu } from 'lucide-react';
import { Logo } from '@/components/layout/logo';
import { navItems, bottomItems } from '@/config/nav';

interface MobileNavProps {
  userRole?: string;
}

export function MobileNav({ userRole }: MobileNavProps) {
  const pathname = usePathname();
  const [open, setOpen] = React.useState(false);

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
                "w-full justify-start gap-3 mb-2 h-12 text-base", // Larger touch target
                isActive && "bg-secondary"
            )}
            asChild
            onClick={() => setOpen(false)}
          >
            <Link href={item.href}>
                <item.icon className="h-5 w-5 shrink-0" />
                <span>{item.label}</span>
            </Link>
          </Button>
      );
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[80vw] sm:w-[350px] p-0 flex flex-col">
          <SheetHeader className="sr-only">
              <SheetTitle>Navigation Menu</SheetTitle>
          </SheetHeader>
        <div className="h-16 flex items-center px-6 border-b">
           <Logo href="/dashboard" />
        </div>
        
        <div className="flex-1 overflow-y-auto py-6 px-4">
           {filteredNavItems.map((item) => <NavLink key={item.href} item={item} />)}
        </div>

        <div className="p-4 border-t space-y-1 bg-muted/20">
           {filteredBottomItems.map((item) => <NavLink key={item.href} item={item} />)}
        </div>
      </SheetContent>
    </Sheet>
  );
}
