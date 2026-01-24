
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDistanceToNow } from "date-fns";

interface ActivityItem {
    id: string;
    type: 'inflow' | 'outflow';
    customerName: string;
    commodity: string;
    bags: number;
    date: Date;
    invoiceNo?: string;
}

interface RecentActivityProps {
    activities: ActivityItem[];
}

export function RecentActivity({ activities }: RecentActivityProps) {
    if (!activities || activities.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Recent Activity</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                    No recent activity recorded.
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="col-span-1 md:col-span-2 lg:col-span-3">
             <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
                <ScrollArea className="h-[300px] pr-4">
                    <div className="space-y-6 ml-2 border-l-2 border-dashed pl-6 relative">
                         {activities.map((activity, index) => (
                            <div key={activity.id + index} className="relative group">
                                 {/* Timeline Dot */}
                                 <div className={`absolute -left-[31px] top-1 h-3 w-3 rounded-full border-2 
                                        ${activity.type === 'inflow' ? 'bg-green-100 border-green-500' : 'bg-red-100 border-red-500'} 
                                        group-hover:scale-125 transition-transform`} />
                                
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                                    <div className="space-y-1">
                                         <p className="text-sm font-medium leading-none">
                                            {activity.type === 'inflow' ? 'Received' : 'Dispatched'} 
                                            <span className="font-bold ml-1">{activity.bags} bags</span>
                                            <span className="ml-1 text-muted-foreground">of {activity.commodity}</span>
                                         </p>
                                         <p className="text-xs text-muted-foreground flex items-center gap-1">
                                            {activity.customerName}
                                            {activity.invoiceNo && <span>· #{activity.invoiceNo}</span>}
                                         </p>
                                    </div>
                                    <div className="text-xs text-muted-foreground tabular-nums">
                                        {formatDistanceToNow(activity.date, { addSuffix: true })}
                                    </div>
                                </div>
                            </div>
                         ))}
                    </div>
                </ScrollArea>
            </CardContent>
        </Card>
    );
}

export function RecentActivitySkeleton() {
    return (
        <Card className="col-span-3">
             <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
             <CardContent>
                <div className="space-y-8">
                     {[1, 2, 3].map((i) => (
                         <div key={i} className="flex items-center gap-4">
                             <div className="h-10 w-10 rounded-full bg-muted animate-pulse" />
                             <div className="space-y-2 flex-1">
                                 <div className="h-4 w-[200px] bg-muted animate-pulse rounded" />
                                 <div className="h-3 w-[150px] bg-muted animate-pulse rounded" />
                             </div>
                         </div>
                     ))}
                </div>
             </CardContent>
        </Card>
    );
}
