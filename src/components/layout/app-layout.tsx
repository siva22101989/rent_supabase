
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
import { ModeToggle } from '@/components/mode-toggle';
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

export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isDashboard = pathname === '/';
  const router = useRouter();
  
  const [user, setUser] = React.useState<User | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const supabase = createClient();
    
    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (!session) {
         router.push('/login');
      }
    });

    return () => subscription.unsubscribe();
  }, [router]);


  React.useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);


  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
  };

  if (loading || !user) {
    return (
        <div className="flex min-h-screen w-full flex-col items-center justify-center">
            <div>Loading...</div>
        </div>
    );
  }

  // Smart Back Logic
  const getBackLink = () => {
      if (isDashboard) return null;
      
      const parts = pathname.split('/').filter(Boolean);
      // If we are deep (e.g. /customers/123), go up one level
      if (parts.length > 1) {
          const parentPath = '/' + parts.slice(0, -1).join('/');
          return { href: parentPath, label: 'Back' };
      }
      
      // If we are at top level (e.g. /customers), go to Dashboard
      return { href: '/', label: 'Dashboard' };
  };

  const backLink = getBackLink();

  return (
    <div className="flex min-h-screen w-full flex-col">
       <header className="sticky top-0 flex h-16 items-center justify-between gap-4 border-b bg-card px-4 md:px-6">
            <div className="flex items-center gap-4">
              {backLink && (
                  <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                    <Link href={backLink.href}>
                      <ArrowLeft className="h-4 w-4" />
                      <span className="sr-only">Back to {backLink.label}</span>
                    </Link>
                  </Button>
              )}
              <Logo />
            </div>
            
            <div className="flex-1 flex justify-center max-w-xl mx-auto px-4">
                <CommandSearch />
            </div>

            <div className="flex items-center gap-2">
              {/* <NotificationBell /> */} {/* Disabled for now */}
              <ModeToggle />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                   <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      {/* Supabase user metadata access options */}
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
                  <DropdownMenuItem asChild>
                    <Link href="/settings">Settings</Link>
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
        <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">{children}</main>
    </div>
  );
}

