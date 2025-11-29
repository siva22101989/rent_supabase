'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import type { Customer, StorageRecord } from '@/lib/definitions';
import { format } from 'date-fns';
import { getRecordStatus, type RecordStatusInfo } from '@/lib/billing';
import { formatCurrency, toDate } from '@/lib/utils';
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from '../ui/table';

type BillReceiptProps = {
  record: StorageRecord;
  customer: Customer;
};

export const BillReceipt = React.forwardRef<HTMLDivElement, BillReceiptProps>(
  ({ record, customer }, ref) => {
    const [statusInfo, setStatusInfo] = useState<RecordStatusInfo | null>(null);
    const [formattedBillDate, setFormattedBillDate] = useState('');
    const [simplifiedRecordId, setSimplifiedRecordId] = useState('');

    useEffect(() => {
        const safeRecord = {
            ...record,
            storageStartDate: toDate(record.storageStartDate),
            storageEndDate: record.storageEndDate ? toDate(record.storageEndDate) : null,
        }
        // Hydration safety
        setStatusInfo(getRecordStatus(safeRecord));
        setFormattedBillDate(format(new Date(), 'dd MMM yyyy'));
        
        // Simplify record ID
        const idParts = record.id.split('-');
        const numericId = idParts.length > 1 ? parseInt(idParts[1], 10) : NaN;
        if (!isNaN(numericId)) {
            // A bit of a simplification, but should work for display
            // This is not guaranteed to be sequential if records are deleted
            // A real implementation would need a counter in a database.
            setSimplifiedRecordId((numericId % 10000).toString());
        } else {
            setSimplifiedRecordId(record.id);
        }


    }, [record]);

    if (!statusInfo) return null;

    return (
        <div ref={ref} className="printable-area bg-white p-4">
            <Card className="w-full shadow-none border-0">
                <CardHeader className="text-center">
                    <CardTitle className="text-2xl">SRI LAKSHMI WAREHOUSE</CardTitle>
                    <p className='text-sm text-muted-foreground'>MOBILE NO 9160606633</p>
                    <CardDescription>Billing Statement</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <h3 className="font-semibold mb-2">Customer Details</h3>
                            <p>{customer.name}</p>
                             <p>S/o {customer.fatherName || 'N/A'}</p>
                            <p>{customer.village || customer.address}</p>
                            <p>Phone: {customer.phone}</p>
                        </div>
                         <div>
                            <h3 className="font-semibold mb-2">Billing Details</h3>
                            <p><span className="font-medium">Bill Date:</span> {formattedBillDate}</p>
                            <p><span className="font-medium">Record ID:</span> {simplifiedRecordId}</p>
                            <p><span className="font-medium">Commodity:</span> {record.commodityDescription}</p>
                        </div>
                    </div>

                    <Separator />

                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[50px]">No.</TableHead>
                                <TableHead>Description</TableHead>
                                <TableHead className="text-right">Quantity</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            <TableRow>
                                <TableCell>1</TableCell>
                                <TableCell>{record.commodityDescription} Bags</TableCell>
                                <TableCell className="text-right">{record.bagsStored}</TableCell>
                            </TableRow>
                        </TableBody>
                        <TableFooter>
                            <TableRow>
                                <TableCell colSpan={2} className="text-right font-bold">Total Bags</TableCell>
                                <TableCell className="text-right font-bold">{record.bagsStored}</TableCell>
                            </TableRow>
                        </TableFooter>
                    </Table>


                    <Separator />

                    <div className="mt-20 pt-10 flex justify-between text-center text-sm">
                        <div className="w-1/2">
                            <div className="border-t border-gray-400 mx-4 pt-2">Manager Signature</div>
                        </div>
                        <div className="w-1/2">
                             <div className="border-t border-gray-400 mx-4 pt-2">Customer Signature</div>
                        </div>
                    </div>

                    <div className="text-xs text-muted-foreground space-y-2 pt-6">
                       <p>
                            <strong>Note:</strong>
                            This statement reflects the current status of the active storage record. For withdrawals, final rent will be calculated based on the withdrawal date.
                        </p>
                        <p>This is a computer-generated document and does not require a signature.</p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
  }
);

BillReceipt.displayName = 'BillReceipt';
