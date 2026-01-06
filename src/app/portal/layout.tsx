
import { Logo } from '@/components/layout/logo';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { LogOut, User } from 'lucide-react';
import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import { PortalHeaderUserMenu } from '@/components/portal/header-user-menu';

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

    // Fetch user profile for name
    const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', user.id).single();
    const displayName = profile?.full_name || 'Farmer Account';

    return (
        <div className="min-h-screen bg-background">
            {/* Simple Portal Header */}
            <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-md px-6 h-16 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <Logo href="/" />
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
                     <PortalHeaderUserMenu 
                        email={user.email || ''} 
                        name={displayName} 
                        role={role || undefined} 
                     />
                </div>
            </header>
            
            <main className="container mx-auto py-8 px-4">
                {children}
            </main>
        </div>
    );
}
