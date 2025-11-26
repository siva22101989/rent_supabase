
import { AppLayout } from "@/components/layout/app-layout";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { storageRecords as getStorageRecords, customers as getCustomers } from "@/lib/data";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import type { Customer, StorageRecord } from "@/lib/definitions";
import { Badge } from "@/components/ui/badge";

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

export default async function ReportsPage() {
    const allRecords = await getStorageRecords();
    const allCustomers = await getCustomers();
    
    const recordsWithBalance = allRecords.map(record => {
        const totalBilled = record.hamaliPayable + (record.totalRentBilled || 0);
        const balanceDue = totalBilled - record.amountPaid;
        return { ...record, totalBilled, balanceDue };
    }).sort((a, b) => {
        const dateA = a.storageStartDate instanceof Date ? a.storageStartDate.getTime() : 0;
        const dateB = b.storageStartDate instanceof Date ? b.storageStartDate.getTime() : 0;
        return dateB - dateA;
    });

  return (
    <AppLayout>
      <PageHeader
        title="All Transactions Report"
        description="A complete log of all storage records, both active and completed."
      />
        <Card>
            <CardHeader>
                <CardTitle>Transaction Log</CardTitle>
            </CardHeader>
            <CardContent>
                 <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Customer</TableHead>
                            <TableHead>Start Date</TableHead>
                            <TableHead>End Date</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Bags</TableHead>
                            <TableHead className="text-right">Total Billed</TableHead>
                            <TableHead className="text-right">Amount Paid</TableHead>
                            <TableHead className="text-right">Balance Due</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {await Promise.all(recordsWithBalance.map(async (record) => {
                            const customerName = await getCustomerName(record.customerId, allCustomers);
                            return (
                            <TableRow key={record.id}>
                                <TableCell className="font-medium">{customerName}</TableCell>
                                <TableCell>{record.storageStartDate ? format(record.storageStartDate, 'dd MMM yyyy') : 'N/A'}</TableCell>
                                <TableCell>
                                    {record.storageEndDate ? format(record.storageEndDate, 'dd MMM yyyy') : 'N/A'}
                                </TableCell>
                                <TableCell>
                                    <Badge variant={record.storageEndDate ? "secondary" : "default"} className={record.storageEndDate ? 'bg-zinc-100 text-zinc-800' : 'bg-green-100 text-green-800'}>
                                        {record.storageEndDate ? 'Completed' : 'Active'}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right">{record.bagsStored}</TableCell>
                                <TableCell className="text-right font-mono">{formatCurrency(record.totalBilled)}</TableCell>
                                <TableCell className="text-right font-mono">{formatCurrency(record.amountPaid)}</TableCell>
                                <TableCell className={`text-right font-mono ${record.balanceDue > 0 ? 'text-destructive' : ''}`}>
                                    {formatCurrency(record.balanceDue)}
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
