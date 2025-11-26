
import { AppLayout } from "@/components/layout/app-layout";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { storageRecords as getStorageRecords, customers as getCustomers } from "@/lib/data";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";

async function getCustomerName(customerId: string) {
  const customers = await getCustomers();
  return customers.find(c => c.id === customerId)?.name ?? 'Unknown';
}

function formatCurrency(amount: number) {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 2,
    }).format(amount);
}

export default async function BillingPage() {
    const allRecords = await getStorageRecords();
    const withdrawnRecords = allRecords.filter(r => r.storageEndDate);

  return (
    <AppLayout>
      <PageHeader
        title="Billing History"
        description="View all completed and billed storage records."
      />
        <Card>
            <CardHeader>
                <CardTitle>Completed Transactions</CardTitle>
            </CardHeader>
            <CardContent>
                 <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Record ID</TableHead>
                            <TableHead>Customer</TableHead>
                            <TableHead>Commodity</TableHead>
                            <TableHead className="text-right">Total Billed</TableHead>
                            <TableHead>Date In</TableHead>
                            <TableHead>Date Out</TableHead>
                            <TableHead>Status</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {await Promise.all(withdrawnRecords.map(async (record) => {
                            const customerName = await getCustomerName(record.customerId);
                            return (
                            <TableRow key={record.id}>
                                <TableCell className="font-medium">{record.id}</TableCell>
                                <TableCell>{customerName}</TableCell>
                                <TableCell>{record.commodityDescription}</TableCell>
                                <TableCell className="text-right font-mono">{formatCurrency(record.totalBilled)}</TableCell>
                                <TableCell>{format(record.storageStartDate, 'dd MMM yyyy')}</TableCell>
                                <TableCell>{record.storageEndDate ? format(record.storageEndDate, 'dd MMM yyyy') : 'N/A'}</TableCell>
                                <TableCell>
                                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                                        Completed
                                    </Badge>
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
