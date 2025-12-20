import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { AddPaymentDialog } from "@/components/payments/add-payment-dialog";
import { formatCurrency } from "@/lib/utils";
import { getStorageRecords, getCustomers } from "@/lib/queries";

export const dynamic = 'force-dynamic';

export default async function PendingPaymentsPage() {
    const [allRecords, allCustomers] = await Promise.all([
        getStorageRecords(),
        getCustomers()
    ]);

    const pendingRecords = allRecords.map(record => {
        const totalBilled = (record.hamaliPayable || 0) + (record.totalRentBilled || 0);
        const amountPaid = (record.payments || []).reduce((acc: any, p: any) => acc + p.amount, 0);
        const balanceDue = totalBilled - amountPaid;
        return { ...record, totalBilled, amountPaid, balanceDue };
    }).filter(record => record.balanceDue > 0);

    const getCustomerName = (customerId: string) => {
        return allCustomers?.find(c => c.id === customerId)?.name ?? 'Unknown';
    }

    return (
    <>
            <PageHeader
                title="Pending Payments"
                description="View all records with an outstanding balance."
            />
             <div className="space-y-4">
                 {/* Mobile View */}
                 <div className="grid gap-4 md:hidden">
                    {pendingRecords.map((record) => {
                        const customerName = getCustomerName(record.customerId);
                        return (
                             <Card key={record.id} className="overflow-hidden">
                                <CardHeader className="bg-muted/40 p-4 pb-2">
                                    <div className="flex justify-between items-start">
                                        <div className="space-y-1">
                                            <CardTitle className="text-base font-medium">{customerName}</CardTitle>
                                            <div className="text-xs text-muted-foreground font-mono">#{record.id}</div>
                                        </div>
                                        <Badge variant={record.storageEndDate ? "secondary" : "default"} className={record.storageEndDate ? 'bg-green-100 text-green-800' : ''}>
                                            {record.storageEndDate ? 'Completed' : 'Active'}
                                        </Badge>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-4 pt-2 space-y-3">
                                   <div className="grid grid-cols-2 gap-2 text-sm">
                                        <div className="text-muted-foreground">Total Billed:</div>
                                        <div className="text-right font-medium">{formatCurrency(record.totalBilled)}</div>
                                        
                                        <div className="text-muted-foreground">Amount Paid:</div>
                                        <div className="text-right text-green-600">{formatCurrency(record.amountPaid)}</div>
                                        
                                        <div className="text-muted-foreground font-medium pt-1 border-t">Balance Due:</div>
                                        <div className="text-right font-bold text-destructive pt-1 border-t">{formatCurrency(record.balanceDue)}</div>
                                   </div>
                                    <div className="pt-2">
                                        <AddPaymentDialog record={record} />
                                    </div>
                                </CardContent>
                             </Card>
                        )
                    })}
                     {pendingRecords.length === 0 && (
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
                                    <TableHead>Record ID</TableHead>
                                    <TableHead>Customer</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Hamali</TableHead>
                                    <TableHead className="text-right">Rent</TableHead>
                                    <TableHead className="text-right">Total Billed</TableHead>
                                    <TableHead className="text-right">Paid</TableHead>
                                    <TableHead className="text-right">Balance</TableHead>
                                    <TableHead className="w-[100px] text-right"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {pendingRecords.map((record) => {
                                    const customerName = getCustomerName(record.customerId);
                                    return (
                                    <TableRow key={record.id}>
                                        <TableCell className="font-medium">{record.id}</TableCell>
                                        <TableCell>{customerName}</TableCell>
                                        <TableCell>
                                            <Badge variant={record.storageEndDate ? "secondary" : "default"} className={record.storageEndDate ? 'bg-green-100 text-green-800' : ''}>
                                                {record.storageEndDate ? 'Completed' : 'Active'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right font-mono text-muted-foreground">{formatCurrency(record.hamaliPayable || 0)}</TableCell>
                                        <TableCell className="text-right font-mono text-muted-foreground">{formatCurrency(record.totalRentBilled || 0)}</TableCell>
                                        <TableCell className="text-right font-mono font-medium">{formatCurrency(record.totalBilled)}</TableCell>
                                        <TableCell className="text-right font-mono text-green-600">{formatCurrency(record.amountPaid)}</TableCell>
                                        <TableCell className="text-right font-mono text-destructive font-bold">{formatCurrency(record.balanceDue)}</TableCell>
                                        <TableCell className="text-right">
                                            <AddPaymentDialog record={record} />
                                        </TableCell>
                                    </TableRow>
                                )})}
                                 {pendingRecords.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
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
