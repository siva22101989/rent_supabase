'use client';

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { LogOut } from 'lucide-react';

import { signOutAction } from '@/lib/actions';
import Link from 'next/link';
import { LayoutDashboard } from 'lucide-react';

interface PortalHeaderUserMenuProps {
    email: string;
    name: string;
    role?: string;
}

export function PortalHeaderUserMenu({ email, name, role }: PortalHeaderUserMenuProps) {
    const isAdmin = role === 'admin' || role === 'super_admin' || role === 'owner';

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-primary text-primary-foreground">
                            {name?.[0]?.toUpperCase() || email?.[0]?.toUpperCase()}
                        </AvatarFallback>
                    </Avatar>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end">
                <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{name}</p>
                        <p className="text-xs leading-none text-muted-foreground">{email}</p>
                    </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                
                {isAdmin && (
                    <>
                        <DropdownMenuItem asChild>
                            <Link href="/" className="w-full cursor-pointer">
                                <LayoutDashboard className="mr-2 h-4 w-4" />
                                <span>Back to Dashboard</span>
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                    </>
                )}

                <DropdownMenuItem asChild>
                    <form action={signOutAction} className="w-full">
                        <button className="flex w-full items-center cursor-pointer">
                            <LogOut className="mr-2 h-4 w-4" /> Sign Out
                        </button>
                    </form>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
