
'use client';

import { useEffect, useState, useMemo } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Bell, CheckCheck, Trash2, ChevronRight, ChevronDown } from 'lucide-react';
import type { NotificationEntry } from '@/lib/definitions';
import { markAllNotificationsAsRead, markNotificationsAsRead } from '@/lib/notification-actions';
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
import { useToast } from '@/hooks/use-toast';

export function NotificationBell() {
    const [notifications, setNotifications] = useState<NotificationEntry[]>([]);
    const [hasUnread, setHasUnread] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const supabase = createClient();

    const { toast } = useToast();

    const fetchNotes = async () => {
         try {
             setError(null);
             const { data: { user } } = await supabase.auth.getUser();
             if (!user) return;

             // Fetch notifications that this user hasn't read yet
             // Get all read notification IDs for current user first
             const { data: readIds } = await supabase
                .from('notification_reads')
                .select('notification_id')
                .eq('user_id', user.id);
             
             const readNotificationIds = readIds?.map(r => r.notification_id) || [];
             
             // Now fetch notifications excluding the ones already read
             let query = supabase
                .from('notifications')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(100);
             
             // Only add the filter if there are read notifications
             if (readNotificationIds.length > 0) {
                 query = query.not('id', 'in', `(${readNotificationIds.join(',')})`);
             }
             
             const { data, error } = await query;
             
             if (error) {
                 console.error('Failed to fetch notifications:', error);
                 setError('Failed to load notifications');
                 return;
             }
             
             if (data) {
                 setNotifications(data as NotificationEntry[]);
                 setHasUnread(data.length > 0);
             }
         } catch (err) {
             console.error('Error fetching notifications:', err);
             setError('An error occurred');
         }
    };

    useEffect(() => {
        fetchNotes();
        
        // Set up real-time subscription for new notifications
        const channel = supabase
            .channel('notifications-realtime')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'notifications'
                },
                async (payload) => {
                    const newNotification = payload.new as NotificationEntry;
                    
                    // Check if this notification is for the current user
                    const { data: { user } } = await supabase.auth.getUser();
                    if (!user) return;
                    
                    // If notification is for specific user or for everyone (null)
                    if (newNotification.user_id === null || newNotification.user_id === user.id) {
                        // Add to notifications list
                        setNotifications(prev => [newNotification, ...prev]);
                        setHasUnread(true);
                        
                        // Show toast for warning/error notifications
                        if (newNotification.type === 'warning' || newNotification.type === 'error') {
                            toast({
                                title: newNotification.title,
                                description: newNotification.message,
                                variant: newNotification.type === 'error' ? 'destructive' : 'default'
                            });
                        }
                    }
                }
            )
            .subscribe();
        
        return () => {
            channel.unsubscribe();
        };
    }, []);

    const [expandedGroups, setExpandedGroups] = useState<string[]>([]);
    
    // Group notifications by title + type
    const groupedNotifications = useMemo(() => {
        const groups: Record<string, NotificationEntry[]> = {};
        notifications.forEach(n => {
            const key = `${n.type}-${n.title}`;
            if (!groups[key]) groups[key] = [];
            groups[key].push(n);
        });
        
        return Object.entries(groups)
            .map(([key, items]) => ({
                key,
                title: items[0].title,
                type: items[0].type,
                items: items.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
                latest: items[0],
                count: items.length
            }))
            .sort((a, b) => new Date(b.latest.created_at).getTime() - new Date(a.latest.created_at).getTime());
    }, [notifications]);

    const toggleGroup = (key: string, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setExpandedGroups(prev => 
            prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
        );
    };

    const markGroupRead = async (ids: string[], e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        
        // Optimistic update
        setNotifications(prev => {
            const updated = prev.filter(n => !ids.includes(n.id));
            setHasUnread(updated.length > 0);
            return updated;
        });

        await markNotificationsAsRead(ids);
    };

    const markRead = async (id: string, e?: React.MouseEvent) => {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
        
        const noteToRead = notifications.find(n => n.id === id);
        
        // Optimistic removal
        setNotifications(prev => {
            const updated = prev.filter(n => n.id !== id);
            setHasUnread(updated.length > 0);
            return updated;
        });

        await markNotificationsAsRead([id]);
    };

    const markAllRead = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setLoading(true);

        // Optimistic clear
        const oldNotes = [...notifications];
        setNotifications([]);
        setHasUnread(false);

        const result = await markAllNotificationsAsRead();
        
        if (result.error) {
             console.error("Failed to mark all as read:", result.error);
             setNotifications(oldNotes);
             setHasUnread(true);
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
                            {notifications.length > 0 
                                ? `You have ${notifications.length} unread ${notifications.length === 100 ? '(showing 100+)' : 'messages'}`
                                : 'No unread messages'}
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
                            {groupedNotifications.map((group) => {
                                const isExpanded = expandedGroups.includes(group.key);
                                const isGroup = group.count > 1;

                                if (!isGroup) {
                                    const note = group.items[0];
                                    return (
                                        <DropdownMenuItem 
                                            key={note.id} 
                                            className="flex flex-col items-start gap-1 p-4 cursor-pointer focus:bg-accent/50 border-b last:border-0 rounded-none bg-accent/5"
                                            asChild
                                        >
                                            <div className="w-full relative group">
                                                <Link href={note.link || '#'} className="w-full" onClick={() => markRead(note.id)}>
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
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="absolute -right-2 -top-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                                    onClick={(e) => markRead(note.id, e)}
                                                >
                                                    <CheckCheck className="h-3 w-3" />
                                                </Button>
                                            </div>
                                        </DropdownMenuItem>
                                    );
                                }

                                return (
                                    <div key={group.key} className="border-b last:border-0 bg-accent/5">
                                        <div 
                                            className="flex items-center justify-between p-4 cursor-pointer hover:bg-accent/50 transition-colors"
                                            onClick={(e) => toggleGroup(group.key, e)}
                                        >
                                            <div className="flex items-center gap-2 overflow-hidden">
                                                {isExpanded ? <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />}
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-bold text-primary truncate">
                                                        {group.title} <span className="text-xs font-normal text-muted-foreground ml-1">({group.count})</span>
                                                    </span>
                                                    {!isExpanded && (
                                                        <span className="text-xs text-muted-foreground truncate">
                                                            Latest: {group.latest.message}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-7 text-xs ml-2 shrink-0"
                                                onClick={(e) => markGroupRead(group.items.map(n => n.id), e)}
                                            >
                                                Clear Group
                                            </Button>
                                        </div>
                                        
                                        {isExpanded && (
                                            <div className="bg-background/50 border-t">
                                                {group.items.map(note => (
                                                    <DropdownMenuItem 
                                                        key={note.id} 
                                                        className="flex flex-col items-start gap-1 p-3 pl-8 cursor-pointer focus:bg-accent/50 border-b last:border-0 rounded-none"
                                                        asChild
                                                    >
                                                        <Link href={note.link || '#'} className="w-full" onClick={() => markRead(note.id)}>
                                                            <div className="flex w-full justify-between items-start gap-2">
                                                                <div className="flex-1">
                                                                    <p className="text-xs text-muted-foreground w-full">
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
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </ScrollArea>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
