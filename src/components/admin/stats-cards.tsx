import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Users, Wheat, Database, Activity } from "lucide-react";

interface AdminStatsCardsProps {
    stats: {
        warehouseCount: number;
        usersCount: number;
        customersCount: number;
        activeRecordsCount: number;
        totalStock: number;
    };
}

function AdminStatsCardsComponent({ stats }: AdminStatsCardsProps) {
    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            <StatCard 
                title="Total Warehouses" 
                value={stats.warehouseCount} 
                icon={<Building2 className="h-4 w-4 text-indigo-600" />}
                description="Active platform tenants"
            />
            <StatCard 
                title="Registered Users" 
                value={stats.usersCount} 
                icon={<Users className="h-4 w-4 text-blue-600" />}
                description="System-wide accounts"
            />
            <StatCard 
                title="Total Customers" 
                value={stats.customersCount} 
                icon={<Users className="h-4 w-4 text-green-600" />}
                description="Farmers & businesses"
            />
            <StatCard 
                title="Active Records" 
                value={stats.activeRecordsCount} 
                icon={<Activity className="h-4 w-4 text-rose-600" />}
                description="Currently in storage"
            />
            <StatCard 
                title="Total Stock" 
                value={stats.totalStock.toLocaleString()} 
                unit="Bags"
                icon={<Wheat className="h-4 w-4 text-amber-600" />}
                description="Aggregated platform stock"
            />
        </div>
    );
}

// Wrap with React.memo to prevent unnecessary re-renders
export const AdminStatsCards = React.memo(
    AdminStatsCardsComponent,
    (prevProps, nextProps) => {
        // Only re-render if stats actually change
        return JSON.stringify(prevProps.stats) === JSON.stringify(nextProps.stats);
    }
);

AdminStatsCards.displayName = 'AdminStatsCards';

// Memoize StatCard as well
const StatCard = React.memo(function StatCard({ title, value, unit, icon, description }: { 
    title: string; 
    value: string | number; 
    unit?: string;
    icon: React.ReactNode; 
    description?: string;
}) {
    return (
        <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{title}</CardTitle>
                <div className="p-2 bg-slate-100 rounded-full">{icon}</div>
            </CardHeader>
            <CardContent>
                <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-bold">{value}</span>
                    {unit && <span className="text-xs text-muted-foreground">{unit}</span>}
                </div>
                {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
            </CardContent>
        </Card>
    );
});
