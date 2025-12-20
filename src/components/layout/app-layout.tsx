
'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Logo } from './logo';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ArrowLeft, LogOut } from 'lucide-react';
// import { NotificationBell } from './notification-bell';
import { CommandSearch } from './command-search';
import { ThemeToggle } from '@/components/theme-toggle';
import { WarehouseSwitcher } from '@/components/warehouses/warehouse-switcher';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { createClient } from '@/utils/supabase/client';
import type { User } from '@supabase/supabase-js';
import { LayoutProvider } from '@/components/providers/layout-context';

import { WelcomeOnboarding } from '@/components/onboarding/welcome-onboarding';

import { MobileNav } from './mobile-nav';
import { Sidebar } from './sidebar';
import { LayoutDashboard, Menu } from 'lucide-react';

export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isDashboard = pathname === '/';
  const router = useRouter();
  
  const [user, setUser] = React.useState<User | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [showOnboarding, setShowOnboarding] = React.useState(false);
  const [checkingOnboarding, setCheckingOnboarding] = React.useState(true);
  
  // Layout State
  const [layoutMode, setLayoutMode] = React.useState<'header' | 'sidebar'>('header');
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false);

  // Initialize layout preference
  React.useEffect(() => {
      const savedMode = localStorage.getItem('bagbill-layout-mode') as 'header' | 'sidebar';
      if (savedMode) setLayoutMode(savedMode);
  }, []);

  const toggleLayout = () => {
      const newMode = layoutMode === 'header' ? 'sidebar' : 'header';
      setLayoutMode(newMode);
      localStorage.setItem('bagbill-layout-mode', newMode);
  };

  React.useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (!session) router.push('/login');
    });
    return () => subscription.unsubscribe();
  }, [router]);

  React.useEffect(() => {
    async function checkProfile(userId: string) {
       const supabase = createClient();
       try {
           const { data } = await supabase.from('profiles').select('warehouse_id, role').eq('id', userId).single();
           if (data && !data.warehouse_id && (data.role === 'admin' || data.role === 'manager')) {
               const { count } = await supabase.from('warehouse_assignments').select('*', { count: 'exact', head: true }).eq('user_id', userId);
               setShowOnboarding(!count || count === 0);
           } else {
               setShowOnboarding(false);
           }
       } finally {
           setCheckingOnboarding(false);
       }
    }
    if (user) checkProfile(user.id);
    else if (!loading) setCheckingOnboarding(false);
  }, [user, loading]);

  React.useEffect(() => {
    if (!loading && !user) router.push('/login');
  }, [user, loading, router]);


  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
  };

  if (loading || checkingOnboarding || !user) {
    return (
        <div className="flex min-h-screen w-full flex-col items-center justify-center bg-background">
             <div className="flex flex-col items-center gap-2">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                <p className="text-sm text-muted-foreground animate-pulse">Loading workspace...</p>
             </div>
        </div>
    );
  }

  const getBackLink = () => {
      if (isDashboard) return null;
      const parts = pathname.split('/').filter(Boolean);
      if (parts.length > 1) {
          const parentPath = '/' + parts.slice(0, -1).join('/');
          return { href: parentPath, label: 'Back' };
      }
      return { href: '/', label: 'Dashboard' };
  };

  const backLink = getBackLink();
  const isSidebarMode = layoutMode === 'sidebar';

  return (
    <LayoutProvider isSidebarMode={isSidebarMode}>
    <div className="flex min-h-screen w-full">
       {/* Conditional Sidebar */}
       {isSidebarMode && (
           <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
       )}

       <div className="flex-1 flex flex-col min-h-screen transition-all duration-300">
           {/* Header */}
           <header className="sticky top-0 z-50 flex h-16 items-center justify-between gap-2 md:gap-4 border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60 px-3 md:px-6">
                <div className="flex items-center gap-2 md:gap-4">
                  {/* If in Sidebar Mode, Hide Logo in Header unless on mobile */}
                  {(!isSidebarMode) && (
                      <div className="flex items-center gap-2">
                         {backLink && (
                            <Button variant="ghost" size="icon" className="h-9 w-9 md:h-8 md:w-8" asChild>
                                <Link href={backLink.href}>
                                <ArrowLeft className="h-4 w-4" />
                                <span className="sr-only">Back to {backLink.label}</span>
                                </Link>
                            </Button>
                        )}
                        <Logo />
                      </div>
                  )}

                  {(!isSidebarMode) && (
                      <div className="md:hidden">
                          <MobileNav />
                      </div>
                  )}
                  
                  {isSidebarMode && (
                      <div className="md:hidden">
                          <MobileNav />
                      </div>
                  )}

                  {/* Desktop Title for Sidebar Mode */}
                  {isSidebarMode && backLink && (
                       <Button variant="ghost" size="icon" className="h-9 w-9 md:h-8 md:w-8 md:hidden" asChild>
                            <Link href={backLink.href}>
                            <ArrowLeft className="h-4 w-4" />
                            <span className="sr-only">Back to {backLink.label}</span>
                            </Link>
                        </Button>
                  )}
                 
                </div>
                
                {/* Search Bar - Hidden in Sidebar mode to clean up? Or keep? Keeping for now. */}
                <div className="hidden md:flex flex-1 justify-center max-w-xl mx-auto px-4">
                    <CommandSearch />
                </div>

                <div className="flex items-center gap-1 md:gap-2">
                  <WarehouseSwitcher />
                  <ThemeToggle />
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                       <Button variant="ghost" className="relative h-9 w-9 md:h-8 md:w-8 rounded-full">
                        <Avatar className="h-9 w-9 md:h-8 md:w-8">
                           <AvatarImage src={user.user_metadata?.avatar_url} alt={user.email} />
                          <AvatarFallback>{user.email?.[0].toUpperCase() || 'U'}</AvatarFallback>
                        </Avatar>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56" align="end" forceMount>
                      <DropdownMenuLabel className="font-normal">
                        <div className="flex flex-col space-y-1">
                          <p className="text-sm font-medium leading-none">{user.user_metadata?.full_name || 'User'}</p>
                          <p className="text-xs leading-none text-muted-foreground">
                            {user.email}
                          </p>
                        </div>
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={toggleLayout}>
                        {isSidebarMode ? <LayoutDashboard className="mr-2 h-4 w-4" /> : <Menu className="mr-2 h-4 w-4" />}
                        <span>Switch to {isSidebarMode ? 'Top Nav' : 'Sidebar'}</span>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link href="/settings">Settings</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/portal">My Customer Portal</Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link href="/guide" className="flex items-center">
                            <span className="mr-2">Help & Guide</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={handleLogout}>
                        <LogOut className="mr-2 h-4 w-4" />
                        <span>Log out</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
            </header>
            
            <main className="flex flex-1 flex-col gap-4 p-3 md:gap-8 md:p-8 pb-20 md:pb-8">
                {showOnboarding ? <WelcomeOnboarding /> : children}
            </main>
       </div>
    </div>
    </LayoutProvider>
  );
}

