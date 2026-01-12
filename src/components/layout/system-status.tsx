'use client';

import { useEffect, useState } from 'react';
import { checkSystemHealth, type SystemHealth } from '@/lib/actions/system-health';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function SystemStatus({ className }: { className?: string }) {
    const [health, setHealth] = useState<SystemHealth | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const check = async () => {
             const data = await checkSystemHealth();
             setHealth(data);
             setLoading(false);
        };
        
        check();
        const interval = setInterval(check, 60000); // Check every minute
        return () => clearInterval(interval);
    }, []);

    if (loading) return null;

    const statusColor = {
        online: 'bg-emerald-500',
        degraded: 'bg-amber-500',
        offline: 'bg-rose-500'
    };

    const statusLabel = {
        online: 'All Systems Operational',
        degraded: 'System Degraded',
        offline: 'System Offline'
    };

    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <div className={cn("flex items-center gap-2 px-2 py-1 rounded-full bg-accent/50 cursor-help", className)}>
                        <span className="relative flex h-2 w-2">
                          <span className={cn("animate-ping absolute inline-flex h-full w-full rounded-full opacity-75", statusColor[health?.status || 'offline'])}></span>
                          <span className={cn("relative inline-flex rounded-full h-2 w-2", statusColor[health?.status || 'offline'])}></span>
                        </span>
                        <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider hidden sm:inline-block">
                            {health?.status}
                        </span>
                    </div>
                </TooltipTrigger>
                <TooltipContent>
                    <div className="text-xs">
                        <p className="font-semibold">{statusLabel[health?.status || 'offline']}</p>
                        <p className="text-muted-foreground">DB Latency: {health?.dbLatency}ms</p>
                        <p className="text-muted-foreground text-[10px] mt-1">Updated: {new Date(health?.timestamp || Date.now()).toLocaleTimeString()}</p>
                    </div>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}
