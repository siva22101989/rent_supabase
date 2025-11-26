
import { AppLayout } from "@/components/layout/app-layout";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { storageRecords as getStorageRecords, customers as getCustomers } from "@/lib/data";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format, parseISO } from "date-fns";
import type { Customer, StorageRecord } from "@/lib/definitions";

async function getCustomerName(customerId: string, customers: Customer[]) {
  return customers.find(c => c.id === customerId)?.name ?? 'Unknown';
}

function formatCurrency(amount: number) {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 2,
    }).format(amount);
}

export default async function PaymentsPage() {
    const allRecords = await getStorageRecords();
    const allCustomers = await getCustomers();
    // Filter for records where a payment has been made.
    const paidRecords = allRecords.filter(r => r.amountPaid > 0);

  return (
    <AppLayout>
      <PageHeader
        title="Payments Received"
        description="A log of all payments received across all records."
      />
        <Card>
            <CardHeader>
                <CardTitle>Payment History</CardTitle>
            </CardHeader>
            <CardContent>
                 <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[120px]">Record ID</TableHead>
                            <TableHead>Customer</TableHead>
                            <TableHead>Commodity</TableHead>
                            <TableHead>Date In</TableHead>
                            <TableHead>Date Out</TableHead>
                            <TableHead className="text-right">Amount Paid</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {await Promise.all(paidRecords.map(async (record) => {
                            const customerName = await getCustomerName(record.customerId, allCustomers);
                            const endDate = record.storageEndDate ? (typeof record.storageEndDate === 'string' ? parseISO(record.storageEndDate) : record.storageEndDate) : null;
                            const startDate = typeof record.storageStartDate === 'string' ? parseISO(record.storageStartDate) : record.storageStartDate;

                            return (
                            <TableRow key={record.id}>
                                <TableCell className="font-medium">{record.id}</TableCell>
                                <TableCell>{customerName}</TableCell>
                                <TableCell>{record.commodityDescription}</TableCell>
                                <TableCell>{format(startDate, 'dd MMM yyyy')}</TableCell>
                                <TableCell>{endDate ? format(endDate, 'dd MMM yyyy') : 'N/A'}</TableCell>
                                <TableCell className="text-right font-mono">{formatCurrency(record.amountPaid)}</TableCell>
                            </TableRow>
                        )}))}
                    </TableBody>
                 </Table>
            </CardContent>
        </Card>
    </AppLayout>
  );
}
