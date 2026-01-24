'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, BarChart, Bar 
} from 'recharts';
import { formatCurrency } from "@/lib/utils";

interface AnalyticsPageClientProps {
    financialData: any[]; // { name: 'Jan', revenue: 100, expense: 50, profit: 50 }
    stockData: any[];     // { name: 'Jan', inflow: 100, outflow: 50 }
    yearlyData: any[];    // { year: '2024', revenue: 1000 }
    year: number;
}

export function AnalyticsPageClient({ financialData, stockData, yearlyData, year: _year }: AnalyticsPageClientProps) {
    return (
        <div className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {/* Revenue vs Expense Chart */}
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle>Revenue vs Expenses</CardTitle>
                        <CardDescription>Monthly financial performance</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={financialData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                                    <YAxis 
                                        fontSize={12} 
                                        tickLine={false} 
                                        axisLine={false}
                                        tickFormatter={(value) => `₹${value/1000}k`}
                                    />
                                    <Tooltip 
                                        formatter={(value: number) => formatCurrency(value)}
                                    />
                                    <Legend />
                                    <Line type="monotone" dataKey="revenue" stroke="#16a34a" name="Revenue" strokeWidth={2} />
                                    <Line type="monotone" dataKey="expense" stroke="#dc2626" name="Expense" strokeWidth={2} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* Yearly Growth */}
                <Card>
                    <CardHeader>
                        <CardTitle>YoY Growth</CardTitle>
                        <CardDescription>Annual revenue trend</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={yearlyData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <XAxis dataKey="year" fontSize={12} tickLine={false} axisLine={false} />
                                    <YAxis 
                                        fontSize={12} 
                                        tickLine={false} 
                                        axisLine={false}
                                        tickFormatter={(value) => `₹${value/1000}k`}
                                    />
                                    <Tooltip 
                                        formatter={(value: number) => formatCurrency(value)}
                                        cursor={{fill: 'transparent'}}
                                    />
                                    <Bar dataKey="revenue" fill="#8b5cf6" name="Revenue" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>
            </div>
            
            <div className="grid gap-6 md:grid-cols-2">
                {/* Profit Chart */}
                 <Card>
                    <CardHeader>
                        <CardTitle>Net Profit</CardTitle>
                        <CardDescription>Monthly net earnings</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={financialData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                                    <YAxis 
                                        fontSize={12} 
                                        tickLine={false} 
                                        axisLine={false}
                                        tickFormatter={(value) => `₹${value/1000}k`}
                                    />
                                    <Tooltip 
                                        formatter={(value: number) => formatCurrency(value)}
                                        cursor={{fill: 'transparent'}}
                                    />
                                    <Bar dataKey="profit" fill="#2563eb" name="Net Profit" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Stock Movement Chart */}
            <Card>
                <CardHeader>
                    <CardTitle>Inflow vs Outflow</CardTitle>
                    <CardDescription>Bag movement trends</CardDescription>
                </CardHeader>
                <CardContent>
                     <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={stockData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis fontSize={12} tickLine={false} axisLine={false} />
                                <Tooltip cursor={{fill: 'transparent'}} />
                                <Legend />
                                <Bar dataKey="inflow" fill="#0ea5e9" name="Inflow (Bags)" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="outflow" fill="#f59e0b" name="Outflow (Bags)" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
