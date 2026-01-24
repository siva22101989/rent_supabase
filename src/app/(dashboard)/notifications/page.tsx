
import { createClient } from '@/utils/supabase/server';
import { PageHeader } from '@/components/shared/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Bell, Info, AlertTriangle, AlertCircle, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export const metadata = {
  title: 'Notifications',
  description: 'View your complete notification history.',
};

async function getNotifications() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return [];

  // 1. Get user's read status
  // We need to fetch ALL notifications for the user's scope
  // And then JOIN or manually map the read status.
  // Since we want "History", we want READ and UNREAD.
  
  // Fetch notifications
  const { data: notifications, error } = await supabase
    .from('notifications')
    .select(`
        *,
        notification_reads!left(notification_id)
    `)
    .or(`user_id.is.null,user_id.eq.${user.id}`)
    .order('created_at', { ascending: false })
    .limit(50); // Hard limit for now, could add pagination later

  if (error) {
      console.error('Error fetching history:', error);
      return [];
  }
  
  // Check read status
  const { data: reads } = await supabase
    .from('notification_reads')
    .select('notification_id')
    .eq('user_id', user.id);

  const readSet = new Set(reads?.map(r => r.notification_id));

  return notifications.map(n => ({
      ...n,
      read: readSet.has(n.id)
  }));
}

export default async function NotificationsPage() {
    const notifications = await getNotifications();

    return (
        <div className="space-y-6">
            <PageHeader
                title="Notifications"
                description="History of all system alerts and updates."
                breadcrumbs={[
                    { label: 'Dashboard', href: '/' },
                    { label: 'Notifications' }
                ]}
            />

            <div className="space-y-4">
                {notifications.length === 0 ? (
                    <Card>
                        <CardContent className="flex flex-col items-center justify-center py-10 text-center text-muted-foreground">
                            <Bell className="h-12 w-12 mb-4 opacity-20" />
                            <p>No notifications found.</p>
                        </CardContent>
                    </Card>
                ) : (
                    notifications.map((note) => (
                        <Card key={note.id} className={cn("transition-colors", note.read ? "opacity-70 bg-muted/30" : "border-l-4 border-l-primary")}>
                            <div className="flex items-start p-4 gap-4">
                                <div className={cn("p-2 rounded-full shrink-0", 
                                    note.type === 'error' ? "bg-red-100 text-red-600" :
                                    note.type === 'warning' ? "bg-amber-100 text-amber-600" :
                                    note.type === 'success' ? "bg-green-100 text-green-600" :
                                    "bg-blue-100 text-blue-600"
                                )}>
                                    {note.type === 'error' ? <AlertCircle className="w-5 h-5" /> :
                                     note.type === 'warning' ? <AlertTriangle className="w-5 h-5" /> :
                                     note.type === 'success' ? <CheckCircle className="w-5 h-5" /> :
                                     <Info className="w-5 h-5" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                                        <h3 className="font-semibold text-base">{note.title}</h3>
                                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                                            {new Date(note.created_at).toLocaleString()}
                                        </span>
                                    </div>
                                    <p className="text-muted-foreground mt-1 text-sm">{note.message}</p>
                                    {note.link && (
                                        <Button variant="link" className="px-0 h-auto mt-2 text-primary" asChild>
                                            <Link href={note.link}>View Details &rarr;</Link>
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
}
