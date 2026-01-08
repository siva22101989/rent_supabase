
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
import { WarehouseSwitcher } from '@/components/layout/warehouse-switcher';
import { useWarehouses } from '@/contexts/warehouse-context';
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
import { SubscriptionProvider } from '@/components/providers/subscription-context';

import { WelcomeOnboarding } from '@/components/onboarding/welcome-onboarding';
import { TrialBanner } from '@/components/dashboard/trial-banner';

import { MobileNav } from './mobile-nav';
import { Sidebar } from './sidebar';
import { LayoutDashboard, Menu } from 'lucide-react';


interface AppLayoutProps {
    children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const { warehouses, currentWarehouse } = useWarehouses();
  const currentWarehouseId = currentWarehouse?.id || '';
  const pathname = usePathname();
  const isDashboard = pathname === '/dashboard';
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
      const savedMode = localStorage.getItem('grainflow-layout-mode') as 'header' | 'sidebar';
      if (savedMode) setLayoutMode(savedMode);
  }, []);

  const toggleLayout = () => {
      const newMode = layoutMode === 'header' ? 'sidebar' : 'header';
      setLayoutMode(newMode);
      localStorage.setItem('grainflow-layout-mode', newMode);
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

  const [hasPortalAccess, setHasPortalAccess] = React.useState(false);
  const [userRole, setUserRole] = React.useState('');

  React.useEffect(() => {
    async function checkProfile(userId: string) {
       const supabase = createClient();
       try {
           const { data } = await supabase.from('profiles').select('warehouse_id, role').eq('id', userId).single();
           if (data) {
               setUserRole(data.role || '');
               if (!data.warehouse_id && (data.role === 'admin' || data.role === 'manager')) {
                   const { count } = await supabase.from('warehouse_assignments').select('*', { count: 'exact', head: true }).eq('user_id', userId);
                   setShowOnboarding(!count || count === 0);
               } else {
                   setShowOnboarding(false);
               }
           }

           // Check for Customer Portal Access (Linked Customer Profile)
           const { count } = await supabase
                .from('customers')
                .select('*', { count: 'exact', head: true })
                .eq('linked_user_id', userId);
           setHasPortalAccess((count || 0) > 0);

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
    // derived state change will trigger the redirect in the useEffect above
  };

  const getBackLink = () => {
    if (isDashboard) return null;
    const parts = pathname.split('/').filter(Boolean);
    
    // special cases for admin
    return { href: '/dashboard', label: 'Dashboard' };
  };

  const backLink = getBackLink();
  const isSidebarMode = layoutMode === 'sidebar';

  return (
    <LayoutProvider isSidebarMode={isSidebarMode}>
      <SubscriptionProvider warehouseId={currentWarehouseId}>
        {(loading || checkingOnboarding || !user) ? (
            <div className="flex min-h-screen w-full flex-col items-center justify-center bg-background">
                 <div className="flex flex-col items-center gap-2">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                    <p className="text-sm text-muted-foreground animate-pulse">Loading workspace...</p>
                 </div>
            </div>
        ) : (
            <div className="flex min-h-screen w-full overflow-x-hidden">
               {/* Conditional Sidebar */}
               {isSidebarMode && !showOnboarding && (
                   <Sidebar 
                        collapsed={sidebarCollapsed} 
                        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} 
                        userRole={userRole}
                    />
               )}

               <div className="flex-1 min-w-0 flex flex-col min-h-screen transition-all duration-300">
                   {/* Header */}
                   <header className="sticky top-0 z-50 flex h-16 items-center justify-between gap-4 border-b bg-background/80 backdrop-blur-md px-4 md:px-8">
                        <div className="flex items-center gap-2 md:gap-4">
                          {/* If in Sidebar Mode, Hide Logo in Header unless on mobile */}
                          {(!isSidebarMode && !showOnboarding) && (
                              <div className="flex items-center gap-2 min-w-0">
                                 {backLink && (
                                    <Button variant="ghost" size="icon" className="h-9 w-9 md:h-8 md:w-8 shrink-0" asChild>
                                        <Link href={backLink.href}>
                                        <ArrowLeft className="h-4 w-4" />
                                        <span className="sr-only">Back to {backLink.label}</span>
                                        </Link>
                                    </Button>
                                )}
                                <Logo href="/dashboard" />
                              </div>
                          )}

                          {(!isSidebarMode && !showOnboarding) && (
                              <div className="md:hidden">
                                  <MobileNav userRole={userRole} />
                              </div>
                          )}
                          
                          {isSidebarMode && !showOnboarding && (
                              <div className="md:hidden">
                                  <MobileNav userRole={userRole} />
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

                        <div className="flex items-center gap-1.5 md:gap-3 shrink-0 ml-auto">
                          <div className="hidden xs:block">
                            {warehouses.length > 0 && (
                                <WarehouseSwitcher />
                            )}
                          </div>
                          <ThemeToggle />
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                               <Button variant="ghost" className="relative h-9 w-9 md:h-8 md:w-8 rounded-full border border-primary/10 shadow-sm ring-offset-background transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                                <Avatar className="h-9 w-9 md:h-8 md:w-8">
                                   <AvatarImage src={user.user_metadata?.avatar_url} alt={user.email} />
                                  <AvatarFallback className="bg-primary/5 text-primary text-[10px] md:text-sm font-bold uppercase">{user.email?.[0] || 'U'}</AvatarFallback>
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
                              {hasPortalAccess && (
                                  <DropdownMenuItem asChild>
                                    <Link href="/portal">My Customer Portal</Link>
                                  </DropdownMenuItem>
                              )}
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
                    
                    <main className="flex flex-1 flex-col gap-6 p-4 md:gap-8 md:p-8 pb-24 md:pb-8">
                        <TrialBanner />
                        {/* Onboarding Logic: If we need onboarding, show it, otherwise show children (the page content) */}
                        {showOnboarding && pathname !== '/guide' ? <WelcomeOnboarding /> : children}
                    </main>
               </div>
            </div>
        )}
      </SubscriptionProvider>
    </LayoutProvider>
  );
}

