
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
         const { data: { user } } = await supabase.auth.getUser();
         if (!user) return;

         // Fetch all notifications for warehouse (RLS handles warehouse filter)
         // Join with notification_reads to see what this user has read
         const { data, error } = await supabase.from('notifications')
            .select(`
                *,
                notification_reads!left(user_id)
            `)
            .is('notification_reads.user_id', null) // Only fetch what THIS user hasn't read
            .order('created_at', { ascending: false })
            .limit(20);
         
         if (data) {
             setNotifications(data);
             setHasUnread(data.length > 0);
         }
    };

    useEffect(() => {
        fetchNotes();
        const interval = setInterval(fetchNotes, 30000); 
        return () => clearInterval(interval);
    }, []);

    const markRead = async (id: string) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const noteToRead = notifications.find(n => n.id === id);
        
        // Optimistic removal
        setNotifications(prev => {
            const updated = prev.filter(n => n.id !== id);
            setHasUnread(updated.length > 0);
            return updated;
        });

        // Record that THIS user has read it
        const { error } = await supabase.from('notification_reads').upsert({
            notification_id: id,
            user_id: user.id
        }, { onConflict: 'notification_id,user_id' });
        
        if (error) {
            console.error("Failed to record notification read status:", error.message || error);
            if (noteToRead) {
                setNotifications(prev => [noteToRead, ...prev].sort((a,b) => b.created_at.localeCompare(a.created_at)));
                setHasUnread(true);
            }
        }
    };

    const markAllRead = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setLoading(true);

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            setLoading(false);
            return;
        }
        
        const unreadIds = notifications.map(n => n.id);
        const oldNotes = [...notifications];

        // Optimistic clear
        setNotifications([]);
        setHasUnread(false);

        if (unreadIds.length > 0) {
            const upsertData = unreadIds.map(id => ({
                notification_id: id,
                user_id: user.id
            }));
            
            const { error } = await supabase.from('notification_reads')
                .upsert(upsertData, { onConflict: 'notification_id,user_id' });
            
             if (error) {
                console.error("Failed to mark all as read:", error.message || error);
                setNotifications(oldNotes);
                setHasUnread(true);
            }
        }
        setLoading(false);
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative" aria-label="View notifications">
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
                            You have {notifications.length} unread messages
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
                            <p className="text-sm text-muted-foreground">Inbox zero! No new alerts</p>
                        </div>
                    ) : (
                        <div className="flex flex-col">
                            {notifications.map((note) => (
                                <DropdownMenuItem 
                                    key={note.id} 
                                    className="flex flex-col items-start gap-1 p-4 cursor-pointer focus:bg-accent/50 border-b last:border-0 rounded-none bg-accent/5"
                                    asChild
                                    onClick={() => markRead(note.id)}
                                >
                                    <Link href={note.link || '#'} className="w-full">
                                        <div className="flex w-full justify-between items-start gap-2">
                                             <div className="flex-1 space-y-1">
                                                <p className="text-sm font-bold text-primary">
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
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
