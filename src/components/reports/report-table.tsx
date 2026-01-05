
'use client';

import { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table";
import { format, isValid } from "date-fns";
import type { Customer, StorageRecord } from "@/lib/definitions";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, toDate } from '@/lib/utils';
import { ActionsMenu } from "@/components/dashboard/actions-menu";


type ReportTableProps = {
    // Legacy support (optional)
    records?: StorageRecord[];
    customers?: Customer[];
    // New Generic Support
    data?: any[]; 
    type?: string; // 'storage-default' | 'unloading-register' | 'unloading-expenses' | 'rent-pending-breakdown' | 'hamali-register'
    title: string;
    description?: string;
}

export function ReportTable({ records = [], data = [], customers = [], type = 'storage-default', title, description }: ReportTableProps) {
    const [generatedDate, setGeneratedDate] = useState('');

    useEffect(() => {
        setGeneratedDate(format(new Date(), 'dd MMM yyyy, hh:mm a'));
    }, []);

    const formatDate = (date: string | Date | null | undefined) => {
        if (!date) return '-';
        const d = new Date(date);
        return isValid(d) ? format(d, 'dd MMM yyyy') : '-';
    };

    const getCustomerName = (record: any) => {
        if (record.customer?.name) return record.customer.name;
        if (record.customers?.name) return record.customers.name;
        return customers.find(c => c.id === record.customerId)?.name ?? 'Unknown';
    }

    const recordsWithBalance = records.map(record => {
        const hamali = Number(record.hamaliPayable) || 0;
        const rent = Number(record.totalRentBilled) || 0;
        const totalBilled = hamali + rent;
        const amountPaid = (record.payments || []).reduce((acc, p) => acc + (Number(p.amount) || 0), 0);
        const balanceDue = totalBilled - amountPaid;
        return { ...record, totalBilled, amountPaid, balanceDue };
    }).sort((a, b) => {
        const dateA = toDate(a.storageStartDate);
        const dateB = toDate(b.storageStartDate);
        return dateB.getTime() - dateA.getTime();
    });

    const totalBagsIn = recordsWithBalance.reduce((acc, record) => acc + (Number(record.bagsIn) || 0), 0);
    const totalBagsOut = recordsWithBalance.reduce((acc, record) => acc + (Number(record.bagsOut) || 0), 0);
    const totalBagsStored = recordsWithBalance.reduce((acc, record) => acc + (Number(record.bagsStored) || 0), 0);
    const totalBilledSum = recordsWithBalance.reduce((acc, record) => acc + (Number(record.totalBilled) || 0), 0);
    const totalAmountPaid = recordsWithBalance.reduce((acc, record) => acc + (Number(record.amountPaid) || 0), 0);
    const totalBalanceDue = recordsWithBalance.reduce((acc, record) => acc + (Number(record.balanceDue) || 0), 0);

    return (
        <div className="bg-white p-4 rounded-lg">
            <div className="mb-4">
                <h2 className="text-xl font-bold">Srilakshmi Warehouse</h2>
                <p className="text-lg font-semibold">{title}</p>
                {description && <p className="text-sm text-muted-foreground mb-1">{description}</p>}
                {generatedDate && (
                    <p className="text-xs text-muted-foreground">Generated on: {generatedDate}</p>
                )}
            </div>
            <Table>
                {/* 1. Unloading Register */}
                {type === 'unloading-register' && (
                    <>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Customer</TableHead>
                            <TableHead>Commodity</TableHead>
                            <TableHead>Lorry No</TableHead>
                            <TableHead className="text-right">Bags</TableHead>
                            <TableHead className="text-right">Hamali (₹)</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {(data || []).map((row: any) => (
                            <TableRow key={row.id}>
                                <TableCell>{formatDate(row.unload_date)}</TableCell>
                                <TableCell>{row.customer?.name || 'Unknown'}</TableCell>
                                <TableCell>{row.commodity_description}</TableCell>
                                <TableCell>{row.lorry_tractor_no || '-'}</TableCell>
                                <TableCell className="text-right">{row.bags_unloaded}</TableCell>
                                <TableCell className="text-right">{formatCurrency(row.hamali_amount || 0)}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                    </>
                )}

                 {/* 2. Unloading Expenses */}
                {type === 'unloading-expenses' && (
                    <>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead className="text-right">Amount (₹)</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {(data || []).map((row: any) => (
                            <TableRow key={row.id}>
                                <TableCell>{formatDate(row.date)}</TableCell>
                                <TableCell>{row.description}</TableCell>
                                <TableCell className="text-right font-mono">{formatCurrency(row.amount)}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                    </>
                )}

                 {/* 3. Rent Pending Breakdown */}
                {type === 'rent-pending-breakdown' && (
                    <>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Customer</TableHead>
                            <TableHead>Phone</TableHead>
                            <TableHead className="text-right">Rent Billed</TableHead>
                            <TableHead className="text-right">Rent Paid</TableHead>
                            <TableHead className="text-right text-red-600">Rent Due</TableHead>
                            <TableHead className="text-right border-l">Hamali Billed</TableHead>
                            <TableHead className="text-right">Hamali Paid</TableHead>
                            <TableHead className="text-right text-red-600">Hamali Due</TableHead>
                            <TableHead className="text-right font-bold border-l">Total Pending</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {(data || []).map((row: any) => (
                            <TableRow key={row.id}>
                                <TableCell className="font-medium">{row.name}</TableCell>
                                <TableCell>{row.phone}</TableCell>
                                <TableCell className="text-right">{formatCurrency(row.rentBilled)}</TableCell>
                                <TableCell className="text-right">{formatCurrency(row.rentPaid)}</TableCell>
                                <TableCell className="text-right font-medium text-red-600">{formatCurrency(row.rentPending)}</TableCell>
                                
                                <TableCell className="text-right border-l">{formatCurrency(row.hamaliBilled)}</TableCell>
                                <TableCell className="text-right">{formatCurrency(row.hamaliPaid)}</TableCell>
                                <TableCell className="text-right font-medium text-red-600">{formatCurrency(row.hamaliPending)}</TableCell>
                                
                                <TableCell className="text-right font-bold border-l">{formatCurrency(row.totalPending)}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                    </>
                )}

                {/* Default Storage View (Active Inventory, Hamali Register etc) */}
                {(type === 'storage-default' || type === 'hamali-register') && (
                 <>
                <TableHeader>
                    <TableRow>
                        <TableHead>Customer</TableHead>
                        <TableHead>Start Date</TableHead>
                        <TableHead>End Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Bags In</TableHead>
                        <TableHead className="text-right">Bags Out</TableHead>
                        <TableHead className="text-right">Balance</TableHead>
                        <TableHead className="text-right">Total Billed</TableHead>
                        <TableHead className="text-right">Amount Paid</TableHead>
                        <TableHead className="text-right">Balance Due</TableHead>
                        <TableHead className="w-[50px] text-right print-hide">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {recordsWithBalance.map((record) => {
                        const customerName = getCustomerName(record);
                        const startDate = toDate(record.storageStartDate);
                        const endDate = record.storageEndDate ? toDate(record.storageEndDate) : null;
                        return (
                        <TableRow key={record.id}>
                            <TableCell className="font-medium">{customerName}</TableCell>
                            <TableCell>{formatDate(record.storageStartDate)}</TableCell>
                            <TableCell>
                                {formatDate(record.storageEndDate)}
                            </TableCell>
                            <TableCell>
                                <Badge variant={record.storageEndDate ? "secondary" : "default"} className={record.storageEndDate ? 'bg-zinc-100 text-zinc-800' : 'bg-green-100 text-green-800'}>
                                    {record.storageEndDate ? 'Completed' : 'Active'}
                                </Badge>
                            </TableCell>
                            <TableCell className="text-right">{record.bagsIn || 0}</TableCell>
                            <TableCell className="text-right">{record.bagsOut || 0}</TableCell>
                            <TableCell className="text-right font-bold">{record.bagsStored}</TableCell>
                            <TableCell className="text-right font-mono">{formatCurrency(record.totalBilled || 0)}</TableCell>
                            <TableCell className="text-right font-mono">{formatCurrency(record.amountPaid || 0)}</TableCell>
                            <TableCell className={`text-right font-mono ${record.balanceDue > 0 ? 'text-destructive' : ''}`}>
                                {formatCurrency(record.balanceDue || 0)}
                            </TableCell>
                             <TableCell className="text-right print-hide">
                                <ActionsMenu record={record} customers={customers} />
                            </TableCell>
                        </TableRow>
                    )})}
                    {recordsWithBalance.length === 0 && (
                        <TableRow>
                            <TableCell colSpan={11} className="text-center text-muted-foreground">
                                No records found for the selected customer.
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
                <TableFooter>
                    <TableRow>
                        <TableCell colSpan={4} className="text-right font-bold text-lg">Totals</TableCell>
                        <TableCell className="text-right font-mono font-bold text-lg">{totalBagsIn}</TableCell>
                        <TableCell className="text-right font-mono font-bold text-lg">{totalBagsOut}</TableCell>
                        <TableCell className="text-right font-mono font-bold text-lg">{totalBagsStored}</TableCell>
                        <TableCell className="text-right font-mono font-bold text-lg">{formatCurrency(totalBilledSum)}</TableCell>
                        <TableCell className="text-right font-mono font-bold text-lg">{formatCurrency(totalAmountPaid)}</TableCell>
                        <TableCell className="text-right font-mono font-bold text-lg text-destructive">
                            {formatCurrency(totalBalanceDue)}
                        </TableCell>
                         <TableCell />
                    </TableRow>
                </TableFooter>
                </>
                )}
            </Table>
        </div>
    );
}
