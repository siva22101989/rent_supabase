'use client';

import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import { exportFinancialReportToExcel } from "@/lib/export-utils";
import { 
    LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { 
    TrendingUp, TrendingDown, DollarSign, Users, 
    Clock, Target, AlertCircle, Download
} from "lucide-react";
import Link from "next/link";
import type { 
    RevenueMetrics, 
    MonthlyRevenue, 
    CustomerRevenue, 
    AgingAnalysis 
} from "@/lib/analytics";

interface Props {
    revenueMetrics: RevenueMetrics;
    monthlyTrends: MonthlyRevenue[];
    topCustomers: CustomerRevenue[];
    agingAnalysis: AgingAnalysis[];
    collectionMetrics: {
        collectionRate: number;
        averageDaysToPayment: number;
        totalCollected: number;
        totalBilled: number;
    };
}

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444'];

export function FinancialDashboardClient({
    revenueMetrics,
    monthlyTrends,
    topCustomers,
    agingAnalysis,
    collectionMetrics
}: Props) {
    // Format monthly trends for charts
    const chartData = monthlyTrends.map(m => ({
        month: new Date(m.month + '-01').toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
        Rent: m.rent,
        Hamali: m.hamali,
        Total: m.total
    }));

    // Format aging data for pie chart
    const agingChartData = agingAnalysis.map((a, i) => ({
        name: a.range,
        value: a.amount,
        count: a.count,
        fill: COLORS[i]
    }));

    const handleExportExcel = () => {
        const exportData = {
            summary: [
                { label: 'Total Revenue', value: revenueMetrics.totalRevenue },
                { label: 'Rent Revenue', value: revenueMetrics.rentRevenue },
                { label: 'Hamali Revenue', value: revenueMetrics.hamaliRevenue },
                { label: 'Total Collected', value: revenueMetrics.totalPaid },
                { label: 'Outstanding Dues', value: revenueMetrics.totalOutstanding },
                { label: 'Collection Rate (%)', value: collectionMetrics.collectionRate },
                { label: 'Avg Days to Payment', value: collectionMetrics.averageDaysToPayment }
            ],
            topCustomers: topCustomers.map(c => ({
                name: c.customerName,
                revenue: c.totalRevenue,
                paid: c.amountPaid,
                outstanding: c.outstanding
            })),
            aging: agingAnalysis.map(a => ({
                range: a.range,
                count: a.count,
                amount: a.amount
            }))
        };
        
        exportFinancialReportToExcel(exportData);
    };

    return (
        <>
            <PageHeader
                title="Financial Analytics"
                description="Comprehensive revenue tracking and financial insights"
                backHref="/reports"
            >
                <Button onClick={handleExportExcel} variant="outline">
                    <Download className="mr-2 h-4 w-4" />
                    Export to Excel
                </Button>
            </PageHeader>

            {/* Key Metrics */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(revenueMetrics.totalRevenue)}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Rent: {formatCurrency(revenueMetrics.rentRevenue)} | 
                            Hamali: {formatCurrency(revenueMetrics.hamaliRevenue)}
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Collected</CardTitle>
                        <TrendingUp className="h-4 w-4 text-green-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">
                            {formatCurrency(revenueMetrics.totalPaid)}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            {collectionMetrics.collectionRate.toFixed(1)}% collection rate
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Outstanding Dues</CardTitle>
                        <AlertCircle className="h-4 w-4 text-destructive" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-destructive">
                            {formatCurrency(revenueMetrics.totalOutstanding)}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Pending collection
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Avg. Days to Payment</CardTitle>
                        <Clock className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {Math.round(collectionMetrics.averageDaysToPayment)} days
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Collection efficiency
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Revenue Trends Chart */}
            <Card className="mb-6">
                <CardHeader>
                    <CardTitle>Revenue Trends (Last 12 Months)</CardTitle>
                    <CardDescription>Monthly breakdown of Rent vs Hamali revenue</CardDescription>
                </CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={350}>
                        <LineChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="month" />
                            <YAxis />
                            <Tooltip 
                                formatter={(value: number) => formatCurrency(value)}
                                contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                            />
                            <Legend />
                            <Line type="monotone" dataKey="Rent" stroke="#3b82f6" strokeWidth={2} />
                            <Line type="monotone" dataKey="Hamali" stroke="#10b981" strokeWidth={2} />
                            <Line type="monotone" dataKey="Total" stroke="#8b5cf6" strokeWidth={2} strokeDasharray="5 5" />
                        </LineChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            <div className="grid gap-6 md:grid-cols-2 mb-6">
                {/* Top Customers */}
                <Card>
                    <CardHeader>
                        <CardTitle>Top 10 Customers by Revenue</CardTitle>
                        <CardDescription>Highest revenue contributors</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {topCustomers.map((customer, index) => (
                                <div key={customer.customerId} className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-sm">
                                            {index + 1}
                                        </div>
                                        <div>
                                            <Link 
                                                href={`/customers/${customer.customerId}`}
                                                className="font-medium hover:underline"
                                            >
                                                {customer.customerName}
                                            </Link>
                                            <p className="text-xs text-muted-foreground">
                                                Paid: {formatCurrency(customer.amountPaid)}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="font-bold">{formatCurrency(customer.totalRevenue)}</div>
                                        {customer.outstanding > 0 && (
                                            <p className="text-xs text-destructive">
                                                Due: {formatCurrency(customer.outstanding)}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Aging Analysis */}
                <Card>
                    <CardHeader>
                        <CardTitle>Outstanding Dues Aging</CardTitle>
                        <CardDescription>Age distribution of pending payments</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie
                                    data={agingChartData}
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
                                    {agingChartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.fill} />
                                    ))}
                                </Pie>
                                <Tooltip 
                                    formatter={(value: number) => formatCurrency(value)}
                                    contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="mt-4 space-y-2">
                            {agingAnalysis.map((a, i) => (
                                <div key={a.range} className="flex justify-between text-sm">
                                    <span className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i] }} />
                                        {a.range}
                                    </span>
                                    <span className="font-medium">
                                        {a.count} records · {formatCurrency(a.amount)}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

        </>
    );
}
