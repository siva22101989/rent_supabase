'use client';

import { Warehouse, Activity, Package } from "lucide-react";
import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";

interface DashboardHeroProps {
    warehouseName: string;
    totalStock: number;
    capacity: number;
    activeRecords: number;
}

export function DashboardHero({ warehouseName, totalStock, capacity, activeRecords }: DashboardHeroProps) {
    // Determine greeting based on time of day
    const [greeting, setGreeting] = useState("Good Morning");
    
    useEffect(() => {
        const hour = new Date().getHours();
        if (hour < 12) setGreeting("Good Morning");
        else if (hour < 18) setGreeting("Good Afternoon");
        else setGreeting("Good Evening");
    }, []);

    const occupancyRate = capacity > 0 ? (totalStock / capacity) * 100 : 0;
    
    return (
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-primary/10 via-background to-primary/5 p-6 sm:p-10 border shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
             {/* Decorative Circles */}
             <div className="absolute top-0 right-0 -mr-20 -mt-20 h-[300px] w-[300px] rounded-full bg-primary-foreground/10 blur-3xl opacity-50" />
             <div className="absolute bottom-0 left-0 -ml-20 -mb-20 h-[200px] w-[200px] rounded-full bg-primary-foreground/10 blur-2xl opacity-50" />

            <div className="relative z-10 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                <div className="space-y-2">
                    <div className="flex items-center gap-2 text-primary">
                        <Warehouse className="h-5 w-5" />
                        <span className="font-medium text-sm tracking-wide uppercase">{warehouseName}</span>
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight sm:text-4xl text-foreground">
                        {greeting}, Team! 🌤️
                    </h1>
                    <p className="max-w-[600px] text-muted-foreground text-sm sm:text-base leading-relaxed">
                        Here's what's happening in your warehouse today. 
                        You have <span className="font-semibold text-foreground">{activeRecords} active records</span> and 
                        storage is <span className="font-semibold text-foreground">{occupancyRate.toFixed(1)}% full</span>.
                    </p>
                </div>

                <div className="grid grid-cols-2 gap-4 sm:flex sm:gap-6">
                     <div className="rounded-lg bg-background/50 p-4 border shadow-sm backdrop-blur-sm hover:bg-background/80 transition-colors">
                        <div className="flex items-center gap-2 text-muted-foreground mb-1">
                            <Activity className="h-4 w-4" />
                            <span className="text-xs font-medium uppercase">Active Records</span>
                        </div>
                        <div className="text-2xl font-bold text-foreground tabular-nums">{activeRecords}</div>
                     </div>
                     <div className="rounded-lg bg-background/50 p-4 border shadow-sm backdrop-blur-sm hover:bg-background/80 transition-colors">
                        <div className="flex items-center gap-2 text-muted-foreground mb-1">
                            <Package className="h-4 w-4" />
                            <span className="text-xs font-medium uppercase">Occupancy</span>
                        </div>
                        <div className="text-2xl font-bold text-foreground tabular-nums">{occupancyRate.toFixed(1)}%</div>
                         <div className="h-1 w-full bg-muted mt-2 rounded-full overflow-hidden">
                            <div 
                                className={`h-full ${occupancyRate > 90 ? 'bg-red-400' : 'bg-green-400'}`} 
                                style={{ width: `${Math.min(occupancyRate, 100)}%` }} 
                            />
                        </div>
                     </div>
                </div>
            </div>
        </div>
    );
}

export function DashboardHeroSkeleton() {
    return (
        <Skeleton className="w-full h-[200px] rounded-xl" />
    );
}
