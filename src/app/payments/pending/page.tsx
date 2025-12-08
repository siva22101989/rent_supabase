
'use client';
import { AppLayout } from "@/components/layout/app-layout";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useState, useEffect, useMemo } from "react";
import type { Customer, StorageRecord } from "@/lib/definitions";
import { Badge } from "@/components/ui/badge";
import { AddPaymentDialog } from "@/components/payments/add-payment-dialog";
import { formatCurrency } from "@/lib/utils";
import { storageRecords as getStorageRecords, customers as getCustomers } from "@/lib/data";

function PendingPaymentsTable() {
    const [allRecords, setAllRecords] = useState<StorageRecord[]>([]);
    const [allCustomers, setAllCustomers] = useState<Customer[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchData() {
            const [records, customers] = await Promise.all([
                getStorageRecords(),
                getCustomers()
            ]);
            setAllRecords(records);
            setAllCustomers(customers);
            setLoading(false);
        }
        fetchData();
    }, []);

    const pendingRecords = useMemo(() => {
        if (!allRecords) return [];
        return allRecords.map(record => {
            const totalBilled = (record.hamaliPayable || 0) + (record.totalRentBilled || 0);
            const amountPaid = (record.payments || []).reduce((acc, p) => acc + p.amount, 0);
            const balanceDue = totalBilled - amountPaid;
            return { ...record, totalBilled, amountPaid, balanceDue };
        }).filter(record => record.balanceDue > 0);
    }, [allRecords]);
    
    const getCustomerName = (customerId: string) => {
        return allCustomers?.find(c => c.id === customerId)?.name ?? 'Unknown';
    }

    if (loading) {
        return <div>Loading...</div>;
    }

  return (
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
                                <TableCell className="text-right font-mono">{formatCurrency(record.totalBilled)}</TableCell>
                                <TableCell className="text-right font-mono">{formatCurrency(record.amountPaid)}</TableCell>
                                <TableCell className="text-right font-mono text-destructive">{formatCurrency(record.balanceDue)}</TableCell>
                                <TableCell className="text-right">
                                    <AddPaymentDialog record={record} />
                                </TableCell>
                            </TableRow>
                        )})}
                    </TableBody>
                 </Table>
            </CardContent>
        </Card>
  );
}


export default function PendingPaymentsPage() {
    return (
        <AppLayout>
            <PageHeader
                title="Pending Payments"
                description="View all records with an outstanding balance."
            />
            <PendingPaymentsTable />
        </AppLayout>
    );
}
