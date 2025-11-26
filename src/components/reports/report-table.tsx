
'use client';

import { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table";
import { format } from "date-fns";
import type { Customer, StorageRecord } from "@/lib/definitions";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from '@/lib/utils';

type ReportTableProps = {
    records: StorageRecord[];
    customers: Customer[];
    title: string;
}

export function ReportTable({ records, customers, title }: ReportTableProps) {
    const [generatedDate, setGeneratedDate] = useState('');

    useEffect(() => {
        setGeneratedDate(format(new Date(), 'dd MMM yyyy, hh:mm a'));
    }, []);

    const getCustomerName = (customerId: string) => {
        return customers.find(c => c.id === customerId)?.name ?? 'Unknown';
    }

    const recordsWithBalance = records.map(record => {
        const hamali = record.hamaliPayable || 0;
        const rent = record.totalRentBilled || 0;
        const totalBilled = hamali + rent;
        const amountPaid = (record.payments || []).reduce((acc, p) => acc + p.amount, 0);
        const balanceDue = totalBilled - amountPaid;
        return { ...record, totalBilled, amountPaid, balanceDue };
    }).sort((a, b) => {
        const dateA = new Date(a.storageStartDate);
        const dateB = new Date(b.storageStartDate);
        return dateB.getTime() - dateA.getTime();
    });

    const totalBags = recordsWithBalance.reduce((acc, record) => acc + record.bagsStored, 0);
    const totalBilledSum = recordsWithBalance.reduce((acc, record) => acc + record.totalBilled, 0);
    const totalAmountPaid = recordsWithBalance.reduce((acc, record) => acc + record.amountPaid, 0);
    const totalBalanceDue = recordsWithBalance.reduce((acc, record) => acc + record.balanceDue, 0);

    return (
        <div className="bg-white p-4 rounded-lg">
             <div className="mb-4">
                <h2 className="text-xl font-bold">Srilakshmi Warehouse</h2>
                <p className="text-muted-foreground">{title}</p>
                {generatedDate && (
                    <p className="text-xs text-muted-foreground">Generated on: {generatedDate}</p>
                )}
            </div>
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
                    {recordsWithBalance.map((record) => {
                        const customerName = getCustomerName(record.customerId);
                        return (
                        <TableRow key={record.id}>
                            <TableCell className="font-medium">{customerName}</TableCell>
                            <TableCell>{record.storageStartDate ? format(new Date(record.storageStartDate), 'dd MMM yyyy') : 'N/A'}</TableCell>
                            <TableCell>
                                {record.storageEndDate ? format(new Date(record.storageEndDate), 'dd MMM yyyy') : 'N/A'}
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
                    )})}
                    {recordsWithBalance.length === 0 && (
                        <TableRow>
                            <TableCell colSpan={8} className="text-center text-muted-foreground">
                                No records found for the selected customer.
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
                <TableFooter>
                    <TableRow>
                        <TableCell colSpan={4} className="text-right font-bold text-lg">Totals</TableCell>
                        <TableCell className="text-right font-mono font-bold text-lg">{totalBags}</TableCell>
                        <TableCell className="text-right font-mono font-bold text-lg">{formatCurrency(totalBilledSum)}</TableCell>
                        <TableCell className="text-right font-mono font-bold text-lg">{formatCurrency(totalAmountPaid)}</TableCell>
                        <TableCell className="text-right font-mono font-bold text-lg text-destructive">
                            {formatCurrency(totalBalanceDue)}
                        </TableCell>
                    </TableRow>
                </TableFooter>
            </Table>
        </div>
    );
}
