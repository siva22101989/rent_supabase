
'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export function NotificationBell() {
    const [notifications, setNotifications] = useState<any[]>([]);
    const [hasUnread, setHasUnread] = useState(false);
    const supabase = createClient();

    useEffect(() => {
        const fetchNotes = async () => {
             const { data } = await supabase.from('notifications')
                .select('*')
                .limit(5)
                .order('created_at', { ascending: false });
             
             if (data) {
                 setNotifications(data);
                 setHasUnread(data.some((n: any) => !n.is_read));
             }
        };
        fetchNotes();
        
        // Simple polling for "real-time" feel without socket overhead for now
        const interval = setInterval(fetchNotes, 30000); 
        return () => clearInterval(interval);

    }, []);

    const markRead = async (id: string) => {
        // Optimistic update
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
        setHasUnread(notifications.some(n => n.id !== id && !n.is_read));
        
        await supabase.from('notifications').update({ is_read: true }).eq('id', id);
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5" />
                    {hasUnread && (
                        <span className="absolute top-1 right-2 h-2.5 w-2.5 rounded-full bg-red-600 border-2 border-background" />
                    )}
                </Button>
            </DropdownMenuTrigger>
             <DropdownMenuContent align="end" className="w-80">
                <DropdownMenuLabel>Notifications</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {notifications.length === 0 ? (
                    <div className="p-4 text-center text-sm text-muted-foreground">
                        No notifications
                    </div>
                ) : (
                    notifications.map((note) => (
                        <DropdownMenuItem key={note.id} asChild onClick={() => markRead(note.id)}>
                            <Link href={note.link || '#'} className={cn(
                                "flex flex-col items-start gap-1 p-3 cursor-pointer",
                                !note.is_read ? "bg-muted/50" : ""
                            )}>
                                <div className="flex w-full justify-between items-center">
                                     <span className={cn("font-semibold text-sm", !note.is_read && "text-primary")}>
                                        {note.title}
                                     </span>
                                     <span className="text-[10px] text-muted-foreground">
                                        {new Date(note.created_at).toLocaleDateString()}
                                     </span>
                                </div>
                                <div className="text-xs text-muted-foreground line-clamp-2">{note.message}</div>
                            </Link>
                        </DropdownMenuItem>
                    ))
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
