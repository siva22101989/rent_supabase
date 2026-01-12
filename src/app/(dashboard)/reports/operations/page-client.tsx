'use client';

import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
    BarChart, Bar, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { 
    Warehouse, TrendingUp, Package, Users, 
    Clock, Activity, Target
} from "lucide-react";
import type { 
    CapacityMetrics,
    LotUtilization,
    TurnoverMetrics,
    CommodityMetrics,
    CustomerBehavior
} from "@/lib/operations-analytics";
import { Button } from "@/components/ui/button";

interface Props {
    capacityMetrics: CapacityMetrics;
    lotUtilization: LotUtilization[];
    turnoverMetrics: TurnoverMetrics;
    commodityMetrics: CommodityMetrics[];
    customerBehavior: CustomerBehavior;
    allowExport: boolean;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export function OperationsDashboardClient({
    capacityMetrics,
    lotUtilization,
    turnoverMetrics,
    commodityMetrics,
    customerBehavior,
    allowExport
}: Props) {
    // Format lot utilization for bar chart
    const lotChartData = lotUtilization.map(lot => ({
        name: lot.lotName,
        'Utilization %': Math.round(lot.utilizationRate),
        'Current Stock': lot.currentStock,
        'Capacity': lot.capacity
    }));

    // Format commodity data for pie chart (top 6)
    const commodityChartData = commodityMetrics.slice(0, 6).map((c, i) => ({
        name: c.commodityName,
        value: c.totalBags,
        fill: COLORS[i]
    }));

    return (
        <>
            <PageHeader
                title="Operational Analytics"
                description="Warehouse efficiency and utilization insights"
                backHref="/reports"
            >
               {allowExport ? (
                    <Button variant="outline" size="sm" className="gap-2" disabled title="Export coming soon">
                        <Package className="h-4 w-4" />
                        Export Data
                    </Button>
                ) : (
                    <div className="hidden md:block text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                        Export unavailable
                    </div>
                )}
            </PageHeader>

            {/* Key Metrics */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Capacity Utilization</CardTitle>
                        <Warehouse className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {capacityMetrics.utilizationRate.toFixed(1)}%
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            {capacityMetrics.currentOccupancy} / {capacityMetrics.totalCapacity} bags
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Turnover Rate</CardTitle>
                        <Activity className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {turnoverMetrics.turnoverRate.toFixed(1)}%
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            {turnoverMetrics.totalOutflows} / {turnoverMetrics.totalInflows} completed
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Avg Storage Duration</CardTitle>
                        <Clock className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {Math.round(turnoverMetrics.averageStorageDuration)} days
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Per completed record
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Repeat Customer Rate</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {customerBehavior.repeatCustomerRate.toFixed(1)}%
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            {customerBehavior.activeCustomers} / {customerBehavior.totalCustomers} active
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Lot Utilization Chart */}
            <Card className="mb-6">
                <CardHeader>
                    <CardTitle>Lot-wise Capacity Utilization</CardTitle>
                    <CardDescription>Current stock vs capacity by warehouse lot</CardDescription>
                </CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={350}>
                        <BarChart data={lotChartData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip 
                                contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                            />
                            <Legend />
                            <Bar dataKey="Current Stock" fill="#3b82f6" />
                            <Bar dataKey="Capacity" fill="#94a3b8" />
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            <div className="grid gap-6 md:grid-cols-2 mb-6">
                {/* Commodity Distribution */}
                <Card>
                    <CardHeader>
                        <CardTitle>Commodity Distribution</CardTitle>
                        <CardDescription>Top commodities by total bags stored</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie
                                    data={commodityChartData}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={({ name, percent }) => 
                                        `${name}: ${(percent * 100).toFixed(0)}%`
                                    }
                                    outerRadius={100}
                                    fill="#8884d8"
                                    dataKey="value"
                                >
                                    {commodityChartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.fill} />
                                    ))}
                                </Pie>
                                <Tooltip 
                                    contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="mt-4 space-y-2">
                            {commodityMetrics.slice(0, 6).map((c, i) => (
                                <div key={c.commodityId} className="flex justify-between text-sm">
                                    <span className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i] }} />
                                        {c.commodityName}
                                    </span>
                                    <span className="font-medium">
                                        {c.totalBags} bags · {Math.round(c.averageDuration)} days avg
                                    </span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Customer Insights */}
                <Card>
                    <CardHeader>
                        <CardTitle>Customer Insights</CardTitle>
                        <CardDescription>Behavior and engagement metrics</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-6">
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-medium">Active Customers</span>
                                    <span className="text-2xl font-bold">{customerBehavior.activeCustomers}</span>
                                </div>
                                <div className="w-full bg-secondary rounded-full h-2">
                                    <div 
                                        className="bg-primary h-2 rounded-full transition-all" 
                                        style={{ 
                                            width: `${(customerBehavior.activeCustomers / customerBehavior.totalCustomers) * 100}%` 
                                        }}
                                    />
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">
                                    {customerBehavior.totalCustomers} total customers
                                </p>
                            </div>

                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-medium">Repeat Customer Rate</span>
                                    <span className="text-2xl font-bold">
                                        {customerBehavior.repeatCustomerRate.toFixed(1)}%
                                    </span>
                                </div>
                                <div className="w-full bg-secondary rounded-full h-2">
                                    <div 
                                        className="bg-green-600 h-2 rounded-full transition-all" 
                                        style={{ width: `${customerBehavior.repeatCustomerRate}%` }}
                                    />
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">
                                    Customers with multiple transactions
                                </p>
                            </div>

                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-medium">Avg Bags per Transaction</span>
                                    <span className="text-2xl font-bold">
                                        {Math.round(customerBehavior.averageBagsPerTransaction)}
                                    </span>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Average transaction size
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

        </>
    );
}
