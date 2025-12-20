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
             <Card>
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
                                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                                        No pending payments.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                     </Table>
                </CardContent>
            </Card>
    </>
    );
}
