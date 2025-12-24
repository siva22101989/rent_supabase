import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { getPendingPayments } from "@/lib/queries";
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export const dynamic = 'force-dynamic';

export default async function PendingPaymentsPage() {
    const pendingCustomers = await getPendingPayments(50);

    return (
    <>
            <PageHeader
                title="Pending Payments"
                description="View all customers with outstanding balances."
                breadcrumbs={[
                  { label: 'Dashboard', href: '/' },
                  { label: 'Payments' }
                ]}
            />
             <div className="space-y-4">
                 {/* Mobile View */}
                 <div className="grid gap-4 md:hidden">
                    {pendingCustomers.map((customer: any) => {
                        return (
                             <Card key={customer.id} className="overflow-hidden">
                                <CardHeader className="bg-muted/40 p-4 pb-2">
                                    <div className="flex justify-between items-start">
                                        <div className="space-y-1">
                                            <CardTitle className="text-base font-medium">{customer.name}</CardTitle>
                                            <div className="text-xs text-muted-foreground font-mono">{customer.phone}</div>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-4 pt-2 space-y-3">
                                   <div className="grid grid-cols-2 gap-2 text-sm">
                                        <div className="text-muted-foreground">Total Billed:</div>
                                        <div className="text-right font-medium">{formatCurrency(customer.totalBilled)}</div>
                                        
                                        <div className="text-muted-foreground">Amount Paid:</div>
                                        <div className="text-right text-green-600">{formatCurrency(customer.totalPaid)}</div>
                                        
                                        <div className="text-muted-foreground font-medium pt-1 border-t">Balance Due:</div>
                                        <div className="text-right font-bold text-destructive pt-1 border-t">{formatCurrency(customer.balance)}</div>
                                   </div>
                                    <div className="pt-2">
                                        <Link href={`/customers/${customer.id}`}>
                                            <Button variant="secondary" className="w-full">View Details to Pay</Button>
                                        </Link>
                                    </div>
                                </CardContent>
                             </Card>
                        )
                    })}
                     {pendingCustomers.length === 0 && (
                        <div className="text-center py-8 text-muted-foreground bg-card rounded-lg border">
                            No pending payments.
                        </div>
                    )}
                 </div>

                {/* Desktop View */}
                 <Card className="hidden md:block">
                    <CardHeader>
                        <CardTitle>Outstanding Balances</CardTitle>
                    </CardHeader>
                    <CardContent>
                         <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Customer</TableHead>
                                    <TableHead>Phone</TableHead>
                                    <TableHead className="text-right">Total Billed</TableHead>
                                    <TableHead className="text-right">Paid</TableHead>
                                    <TableHead className="text-right">Balance</TableHead>
                                    <TableHead className="w-[150px] text-right"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {pendingCustomers.map((customer: any) => {
                                    return (
                                    <TableRow key={customer.id}>
                                        <TableCell className="font-medium">{customer.name}</TableCell>
                                        <TableCell>{customer.phone}</TableCell>
                                        <TableCell className="text-right font-mono font-medium">{formatCurrency(customer.totalBilled)}</TableCell>
                                        <TableCell className="text-right font-mono text-green-600">{formatCurrency(customer.totalPaid)}</TableCell>
                                        <TableCell className="text-right font-mono text-destructive font-bold">{formatCurrency(customer.balance)}</TableCell>
                                        <TableCell className="text-right">
                                            <Link href={`/customers/${customer.id}`}>
                                                <Button size="sm" variant="outline">View Details</Button>
                                            </Link>
                                        </TableCell>
                                    </TableRow>
                                )})}
                                 {pendingCustomers.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                                            No pending payments.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                         </Table>
                    </CardContent>
                </Card>
             </div>
    </>
    );
}
