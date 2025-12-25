
import { Logo } from '@/components/layout/logo';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { LogOut, User } from 'lucide-react';
import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
  } from '@/components/ui/dropdown-menu';
  import { Avatar, AvatarFallback } from '@/components/ui/avatar';

import { getCurrentUserRole } from '@/lib/queries';
import { LayoutDashboard } from 'lucide-react';

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    const role = await getCurrentUserRole();
    const isAdmin = role === 'admin' || role === 'super_admin' || role === 'owner';

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Simple Portal Header */}
            <header className="sticky top-0 z-10 w-full border-b bg-white px-6 h-16 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <Logo />
                        <span className="text-sm font-medium bg-primary/10 text-primary px-2 py-1 rounded-full">
                            Customer Portal
                        </span>
                    </div>

                    {isAdmin && (
                        <Button variant="outline" size="sm" asChild className="hidden md:flex gap-2">
                            <Link href="/">
                                <LayoutDashboard className="h-4 w-4" />
                                Back to Dashboard
                            </Link>
                        </Button>
                    )}
                </div>

                <div className="flex items-center gap-4">
                     {isAdmin && (
                        <Button variant="ghost" size="icon" asChild className="md:hidden">
                            <Link href="/">
                                <LayoutDashboard className="h-5 w-5" />
                            </Link>
                        </Button>
                     )}
                     <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                                <Avatar className="h-8 w-8">
                                    <AvatarFallback className="bg-primary text-primary-foreground">
                                        {user.email?.[0].toUpperCase()}
                                    </AvatarFallback>
                                </Avatar>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-56" align="end">
                            <DropdownMenuLabel>
                                <div className="flex flex-col space-y-1">
                                    <p className="text-sm font-medium leading-none">Farmer Account</p>
                                    <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                                </div>
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem asChild>
                                <form action="/auth/signout" method="post">
                                    <button className="flex w-full items-center">
                                        <LogOut className="mr-2 h-4 w-4" /> Sign Out
                                    </button>
                                </form>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </header>
            
            <main className="container mx-auto py-8 px-4">
                {children}
            </main>
        </div>
    );
}
