

import { AppLayout } from "@/components/layout/app-layout";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { storageRecords as getStorageRecords, customers as getCustomers } from "@/lib/data";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import type { Customer, StorageRecord } from "@/lib/definitions";
import { Badge } from "@/components/ui/badge";
import { AddPaymentDialog } from "@/components/payments/add-payment-dialog";
import { formatCurrency } from "@/lib/utils";

async function getCustomerName(customerId: string, customers: Customer[]) {
  return customers.find(c => c.id === customerId)?.name ?? 'Unknown';
}

export default async function PendingPaymentsPage() {
    const allRecords = await getStorageRecords();
    const allCustomers = await getCustomers();
    
    const pendingRecords = allRecords.map(record => {
        const totalBilled = record.hamaliPayable + record.totalRentBilled;
        const amountPaid = (record.payments || []).reduce((acc, p) => acc + p.amount, 0);
        const balanceDue = totalBilled - amountPaid;
        return { ...record, totalBilled, amountPaid, balanceDue };
    }).filter(record => record.balanceDue > 0);

  return (
    <AppLayout>
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
                            <TableHead className="text-right">Total Billed</TableHead>
                            <TableHead className="text-right">Amount Paid</TableHead>
                            <TableHead className="text-right">Balance Due</TableHead>
                            <TableHead className="w-[100px] text-right"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {await Promise.all(pendingRecords.map(async (record) => {
                            const customerName = await getCustomerName(record.customerId, allCustomers);
                            return (
                            <TableRow key={record.id}>
                                <TableCell className="font-medium">{record.id}</TableCell>
                                <TableCell>{customerName}</TableCell>
                                <TableCell>
                                    <Badge variant={record.storageEndDate ? "secondary" : "default"} className={record.storageEndDate ? 'bg-green-100 text-green-800' : ''}>
                                        {record.storageEndDate ? 'Completed' : 'Active'}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right font-mono">{formatCurrency(record.totalBilled)}</TableCell>
                                <TableCell className="text-right font-mono">{formatCurrency(record.amountPaid)}</TableCell>
                                <TableCell className="text-right font-mono text-destructive">{formatCurrency(record.balanceDue)}</TableCell>
                                <TableCell className="text-right">
                                    <AddPaymentDialog record={record} />
                                </TableCell>
                            </TableRow>
                        )}))}
                    </TableBody>
                 </Table>
            </CardContent>
        </Card>
    </AppLayout>
  );
}
