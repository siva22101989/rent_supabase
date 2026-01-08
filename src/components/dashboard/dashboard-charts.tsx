'use client';

import { useDashboardMetrics } from "@/hooks/use-dashboard-metrics";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
// import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts'; // Removed unused

import { IndianRupee, Package, Warehouse, Users, TrendingUp } from 'lucide-react';

export function DashboardCharts({ metrics: initialMetrics }: { metrics?: any }) {
    // Upgrading to SWR for client-side revalidation
    const { metrics } = useDashboardMetrics(initialMetrics);
    
    // Safety check if metrics is null (legacy/initial state)
    if (!metrics) return null;

    return (
        <div className="space-y-6 animate-in fade-in-50">
            {/* KPI Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="hover:shadow-md transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Occupancy Rate</CardTitle>
                         <div className={`p-2 rounded-full ${metrics.occupancyRate > 90 ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                            <Warehouse className="h-4 w-4" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{metrics.occupancyRate.toFixed(1)}%</div>
                        <p className="text-xs text-muted-foreground">
                            {metrics.totalStock} / {metrics.totalCapacity} bags
                        </p>
                        <div className="h-1 w-full bg-secondary mt-3 rounded-full overflow-hidden">
                            <div 
                                className={`h-full ${metrics.occupancyRate > 90 ? 'bg-red-500' : 'bg-green-500'}`} 
                                style={{ width: `${metrics.occupancyRate}%` }} 
                            />
                        </div>
                    </CardContent>
                </Card>
                <Card className="hover:shadow-md transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Records</CardTitle>
                        <div className="p-2 rounded-full bg-blue-100 text-blue-600">
                             <TrendingUp className="h-4 w-4" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{metrics.activeRecordsCount}</div>
                         <p className="text-xs text-muted-foreground">
                            Currently in storage
                        </p>
                    </CardContent>
                </Card>
           </div>
        </div>
    );
}
