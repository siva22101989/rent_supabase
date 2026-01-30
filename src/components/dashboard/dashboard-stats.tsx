'use client';

import { Card, CardContent } from "@/components/ui/card";
import { Warehouse, Package, Users, IndianRupee } from "lucide-react";

interface DashboardStatsProps {
    metrics: {
        totalCapacity: number;
        totalStock: number;
        occupancyRate: number;
        activeRecordsCount: number;
        pendingRevenue?: number;
    } | null;
}

export function DashboardStats({ metrics }: DashboardStatsProps) {
    if (!metrics) return null;

    const stats = [
        {
            title: "Total Stock",
            value: `${metrics.totalStock.toLocaleString()} bags`,
            subValue: `${metrics.occupancyRate.toFixed(1)}% Capacity`,
            icon: Package,
            color: "text-blue-600",
            bg: "bg-blue-100",
            trend: "up" // Mock trend
        },
        {
            title: "Active Records",
            value: metrics.activeRecordsCount,
            subValue: "Current Customers",
            icon: Users,
            color: "text-purple-600",
            bg: "bg-purple-100",
            trend: "up"
        },
        {
            title: "Available Space",
            value: `${(metrics.totalCapacity - metrics.totalStock).toLocaleString()} bags`,
            subValue: "Ready to fill",
            icon: Warehouse,
            color: "text-green-600",
            bg: "bg-green-100",
             trend: "down"
        },
         {
            title: "Pending Revenue",
            value: `₹${(metrics.pendingRevenue || 0).toLocaleString()}`,
            subValue: "Outstanding",
            icon: IndianRupee,
            color: "text-orange-600",
            bg: "bg-orange-100",
            trend: "up"
        }
    ];

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat, index) => (
                <Card key={index} className="overflow-hidden hover:shadow-lg transition-all duration-300 border-none shadow-sm group">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between space-y-0 pb-2">
                             <div className={`p-3 rounded-xl ${stat.bg} ${stat.color} group-hover:scale-110 transition-transform`}>
                                <stat.icon className="h-5 w-5" />
                            </div>
                             {/* Mock Trend Indicator */}
                            <div className={`flex items-center text-xs font-medium ${stat.trend === 'up' ? 'text-green-600' : 'text-stone-500'}`}>
                                {stat.trend === 'up' ? '↑' : '↓'} 
                                <span className="ml-1">Active</span>
                            </div>
                        </div>
                        <div className="mt-4">
                            <h3 className="text-2xl font-bold tracking-tight">{stat.value}</h3>
                            <p className="text-sm text-muted-foreground mt-1 font-medium">{stat.title}</p>
                            <p className="text-xs text-muted-foreground mt-1 opacity-80">{stat.subValue}</p>
                        </div>
                         {/* Decorative gradient line at bottom */}
                         <div className={`absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-${stat.color.split('-')[1]}-400 to-transparent opacity-0 group-hover:opacity-100 transition-opacity`} />
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}
