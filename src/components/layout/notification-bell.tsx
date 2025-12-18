
'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Bell, CheckCheck, Trash2 } from 'lucide-react';
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
import { ScrollArea } from '@/components/ui/scroll-area';

export function NotificationBell() {
    const [notifications, setNotifications] = useState<any[]>([]);
    const [hasUnread, setHasUnread] = useState(false);
    const [loading, setLoading] = useState(false);
    const supabase = createClient();

    const fetchNotes = async () => {
         // Note: In a real app we'd filter by warehouse_id properly here
         // For now relying on RLS or specific query if needed.
         // Let's assume RLS handles it or we fetch global for user.
         const { data } = await supabase.from('notifications')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(20); // Fetch more history
         
         if (data) {
             setNotifications(data);
             setHasUnread(data.some((n: any) => !n.is_read));
         }
    };

    useEffect(() => {
        fetchNotes();
        const interval = setInterval(fetchNotes, 30000); 
        return () => clearInterval(interval);
    }, []);

    const markRead = async (id: string) => {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
        setHasUnread(notifications.some(n => n.id !== id && !n.is_read));
        await supabase.from('notifications').update({ is_read: true }).eq('id', id);
        fetchNotes(); // Refresh to ensure sync
    };

    const markAllRead = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setLoading(true);
        
        // Optimistic
        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
        setHasUnread(false);

        // We can't easily "update all" without a WHERE clause that matches the user's view safely in Client logic
        // But since we have the IDs loaded:
        const unreadIds = notifications.filter(n => !n.is_read).map(n => n.id);
        if (unreadIds.length > 0) {
            await supabase.from('notifications').update({ is_read: true }).in('id', unreadIds);
        }
        setLoading(false);
        fetchNotes();
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5" />
                    {hasUnread && (
                        <span className="absolute top-1 right-2 h-2.5 w-2.5 rounded-full bg-red-600 border-2 border-background animate-pulse" />
                    )}
                </Button>
            </DropdownMenuTrigger>
             <DropdownMenuContent align="end" className="w-[380px] p-0">
                <div className="flex items-center justify-between p-4 border-b">
                    <div>
                        <h4 className="font-semibold leading-none">Notifications</h4>
                        <p className="text-xs text-muted-foreground mt-1">
                            You have {notifications.filter(n => !n.is_read).length} unread messages
                        </p>
                    </div>
                    {hasUnread && (
                        <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 text-xs hover:bg-accent"
                            onClick={markAllRead}
                            disabled={loading}
                        >
                            <CheckCheck className="mr-2 h-3.5 w-3.5" />
                            Mark all read
                        </Button>
                    )}
                </div>
                
                <ScrollArea className="h-[400px]">
                    {notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-[200px] text-center p-4">
                            <Bell className="h-10 w-10 text-muted-foreground/20 mb-3" />
                            <p className="text-sm text-muted-foreground">No notifications yet</p>
                        </div>
                    ) : (
                        <div className="flex flex-col">
                            {notifications.map((note) => (
                                <DropdownMenuItem 
                                    key={note.id} 
                                    className={cn(
                                        "flex flex-col items-start gap-1 p-4 cursor-pointer focus:bg-accent/50 border-b last:border-0 rounded-none",
                                        !note.is_read ? "bg-accent/10" : "opacity-80"
                                    )}
                                    asChild
                                    onClick={() => markRead(note.id)}
                                >
                                    <Link href={note.link || '#'} className="w-full">
                                        <div className="flex w-full justify-between items-start gap-2">
                                             <div className="flex-1 space-y-1">
                                                <p className={cn("text-sm font-medium leading-none", !note.is_read && "text-primary font-bold")}>
                                                    {note.title}
                                                </p>
                                                <p className="text-xs text-muted-foreground w-full line-clamp-2">
                                                    {note.message}
                                                </p>
                                             </div>
                                             <span className="text-[10px] text-muted-foreground whitespace-nowrap shrink-0">
                                                {new Date(note.created_at).toLocaleDateString()}
                                             </span>
                                        </div>
                                    </Link>
                                </DropdownMenuItem>
                            ))}
                        </div>
                    )}
                </ScrollArea>
                {/* Footer or 'View All' can go here */}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
