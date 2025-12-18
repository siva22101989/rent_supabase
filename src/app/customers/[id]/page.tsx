
import { AppLayout } from '@/components/layout/app-layout';
import { PageHeader } from '@/components/shared/page-header';
import { getCustomer, getCustomerRecords } from '@/lib/queries';
import { notFound } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatCurrency } from '@/lib/utils';
import { 
    Package, 
    CreditCard, 
    Calendar, 
    MapPin, 
    Phone, 
    User,
    ArrowDownToDot,
    ArrowUpFromDot,
    PlusCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function CustomerDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const [customer, records] = await Promise.all([
        getCustomer(id),
        getCustomerRecords(id)
    ]);

    if (!customer) {
        notFound();
    }

    // --- Stats Calculation ---
    const activeRecords = records.filter(r => !r.storageEndDate);
    const completedRecords = records.filter(r => r.storageEndDate);
    
    const totalActiveBags = activeRecords.reduce((sum, r) => sum + r.bagsStored, 0);
    
    // Financials
    let totalBilled = 0;
    let totalPaid = 0;
    
    records.forEach(r => {
        const billed = (r.hamaliPayable || 0) + (r.totalRentBilled || 0);
        const paid = (r.payments || []).reduce((acc: any, p: any) => acc + p.amount, 0);
        totalBilled += billed;
        totalPaid += paid;
    });
    
    const totalDue = Math.max(0, totalBilled - totalPaid);

    return (
        <AppLayout>
            <div className="flex flex-col gap-6">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b pb-4">
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-3xl font-bold tracking-tight">{customer.name}</h1>
                            {totalDue > 0 && <Badge variant="destructive">Due: {formatCurrency(totalDue)}</Badge>}
                        </div>
                        <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1"><MapPin className="h-4 w-4" /> {customer.village}</span>
                            <span className="flex items-center gap-1"><Phone className="h-4 w-4" /> {customer.phone}</span>
                            <span className="flex items-center gap-1"><User className="h-4 w-4" /> {customer.fatherName}</span>
                        </div>
                    </div>
                    <div className="flex gap-2">
                         <Button asChild size="sm">
                            <Link href="/inflow">
                                <PlusCircle className="mr-2 h-4 w-4" /> New Inflow
                            </Link>
                        </Button>
                        <Button asChild variant="secondary" size="sm">
                            <Link href="/payments/pending">
                                <CreditCard className="mr-2 h-4 w-4" /> Receive Payment
                            </Link>
                        </Button>
                    </div>
                </div>

                {/* KPI Cards */}
                <div className="grid gap-4 md:grid-cols-3">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                           <CardTitle className="text-sm font-medium">Active Stock</CardTitle>
                           <Package className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{totalActiveBags} Bags</div>
                        </CardContent>
                    </Card>
                    <Card>
                         <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                           <CardTitle className="text-sm font-medium">Total Lifetime Due</CardTitle>
                           <CreditCard className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{formatCurrency(totalBilled)}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                           <CardTitle className="text-sm font-medium">Total Paid</CardTitle>
                           <CreditCard className="h-4 w-4 text-green-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-green-600">{formatCurrency(totalPaid)}</div>
                        </CardContent>
                    </Card>
                </div>

                {/* Tabs for Details */}
                <Tabs defaultValue="active" className="w-full">
                    <TabsList>
                        <TabsTrigger value="active">Active Stock ({activeRecords.length})</TabsTrigger>
                        <TabsTrigger value="history">History ({completedRecords.length})</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="active" className="mt-4 space-y-4">
                        {activeRecords.length === 0 ? (
                            <div className="text-center py-10 text-muted-foreground">No active stock found.</div>
                        ) : (
                            <div className="grid gap-4 md:grid-cols-2">
                                {activeRecords.map((r) => (
                                    <div key={r.id} className="border rounded-lg p-4 bg-card shadow-sm flex flex-col justify-between">
                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                <h3 className="font-semibold">{r.commodityDescription}</h3>
                                                <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
                                                    <Calendar className="h-3 w-3" /> In: {new Date(r.storageStartDate).toLocaleDateString()}
                                                </p>
                                                <p className="text-sm text-muted-foreground flex items-center gap-1">
                                                     <MapPin className="h-3 w-3" /> Lot: {r.location || 'N/A'}
                                                </p>
                                                <div className="flex gap-2 mt-2">
                                                    <Badge variant="secondary" className="text-xs">
                                                        REC-{r.recordNumber}
                                                    </Badge>
                                                </div>
                                            </div>
                                            <Badge variant="outline" className="font-mono text-lg">{r.bagsStored} Bags</Badge>
                                        </div>
                                        <div className="flex justify-end gap-2 mt-2">
                                             <Button asChild variant="ghost" size="sm" className="h-8">
                                                <Link href={`/inflow/receipt/${r.id}`}>View Receipt</Link>
                                            </Button>
                                            <Button asChild variant="default" size="sm" className="h-8">
                                                <Link href="/outflow">Withdraw</Link>
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </TabsContent>

                    <TabsContent value="history" className="mt-4">
                         <div className="rounded-md border overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-muted/50 border-b">
                                    <tr className="text-left">
                                        <th className="p-3 font-medium">Record ID</th>
                                        <th className="p-3 font-medium">Date In</th>
                                        <th className="p-3 font-medium">Date Out</th>
                                        <th className="p-3 font-medium">Item</th>
                                        <th className="p-3 text-right font-medium">Bags</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {completedRecords.map((r) => (
                                        <tr key={r.id} className="border-b last:border-0 hover:bg-muted/50">
                                            <td className="p-3 font-mono">#{r.recordNumber}</td>
                                            <td className="p-3">{new Date(r.storageStartDate).toLocaleDateString()}</td>
                                            <td className="p-3">{r.storageEndDate ? new Date(r.storageEndDate).toLocaleDateString() : '-'}</td>
                                            <td className="p-3">{r.commodityDescription}</td>
                                            <td className="p-3 text-right font-mono">{r.bagsStored}</td>
                                        </tr>
                                    ))}
                                    {completedRecords.length === 0 && (
                                         <tr>
                                            <td colSpan={5} className="p-8 text-center text-muted-foreground">No history available.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                         </div>
                    </TabsContent>
                </Tabs>
            </div>
        </AppLayout>
    );
}
