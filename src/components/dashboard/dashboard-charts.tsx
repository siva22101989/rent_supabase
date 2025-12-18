
'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

export function DashboardCharts({ metrics }: { metrics: any }) {
    if (!metrics) return null;

    const occupancyData = [
        { name: 'Used', value: metrics.totalStock, fill: 'hsl(var(--chart-1))' },
        { name: 'Free', value: metrics.totalCapacity - metrics.totalStock, fill: 'hsl(var(--muted))' },
    ];

    // Mock trend data (would normally fetch real historical data)
    const trendData = [
        { name: 'Mon', bags: 120 },
        { name: 'Tue', bags: 200 },
        { name: 'Wed', bags: metrics.activeRecordsCount * 5 }, // Just dynamic enough to change
        { name: 'Thu', bags: 180 },
        { name: 'Fri', bags: 250 },
        { name: 'Sat', bags: 300 },
        { name: 'Sun', bags: metrics.totalStock / 10 },
    ];

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7 mb-8">
            <Card className="col-span-4">
                <CardHeader>
                    <CardTitle>Overview</CardTitle>
                    <CardDescription>
                        Weekly Inflow/Outflow Activity
                    </CardDescription>
                </CardHeader>
                <CardContent className="pl-2">
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={trendData}>
                            <XAxis
                                dataKey="name"
                                stroke="#888888"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                            />
                            <YAxis
                                stroke="#888888"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                                tickFormatter={(value) => `${value}`}
                            />
                            <Tooltip 
                                cursor={{fill: 'transparent'}}
                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                            />
                            <Bar
                                dataKey="bags"
                                fill="hsl(var(--primary))"
                                radius={[4, 4, 0, 0]}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            <Card className="col-span-3">
                 <CardHeader>
                    <CardTitle>Storage Capacity</CardTitle>
                    <CardDescription>
                        Current utilization of warehouse space
                    </CardDescription>
                </CardHeader>
                <CardContent>
                     <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                             <Pie
                                data={occupancyData}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {occupancyData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.fill} />
                                ))}
                            </Pie>
                             <Tooltip 
                                formatter={(value: number) => [`${value} Bags`, 'Quantity']}
                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                            />
                            <Legend verticalAlign="bottom" height={36}/>
                        </PieChart>
                     </ResponsiveContainer>
                         <div className="text-center text-2xl font-bold mt-2">
                        {metrics.occupancyRate.toFixed(1)}% Full
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
