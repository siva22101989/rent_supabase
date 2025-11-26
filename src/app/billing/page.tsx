
import { AppLayout } from "@/components/layout/app-layout";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { storageRecords as getStorageRecords, customers as getCustomers } from "@/lib/data";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format, parseISO } from "date-fns";
import { Badge } from "@/components/ui/badge";
import type { Customer, StorageRecord } from "@/lib/definitions";
import { EditBillingDialog } from "@/components/billing/edit-billing-dialog";
import { DeleteBillingDialog } from "@/components/billing/delete-billing-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreHorizontal } from "lucide-react";


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

function ActionsMenu({ record }: { record: StorageRecord }) {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                    <span className="sr-only">Open menu</span>
                    <MoreHorizontal className="h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <EditBillingDialog record={record}>
                    <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                        Edit
                    </DropdownMenuItem>
                </EditBillingDialog>
                <DeleteBillingDialog recordId={record.id}>
                    <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-red-600">
                        Delete
                    </DropdownMenuItem>
                </DeleteBillingDialog>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

export default async function BillingPage() {
    const allRecords = await getStorageRecords();
    const allCustomers = await getCustomers();
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
                            <TableHead className="w-[120px]">Record ID</TableHead>
                            <TableHead>Customer</TableHead>
                            <TableHead>Commodity</TableHead>
                            <TableHead>Date In</TableHead>
                            <TableHead>Date Out</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Total Paid</TableHead>
                            <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {await Promise.all(withdrawnRecords.map(async (record) => {
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
                                <TableCell>
                                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                                        Completed
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right font-mono">{formatCurrency(record.amountPaid)}</TableCell>
                                <TableCell>
                                    <ActionsMenu record={record} />
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
