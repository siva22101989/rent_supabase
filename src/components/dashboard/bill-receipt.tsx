'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import type { Customer, StorageRecord } from '@/lib/definitions';
import { format } from 'date-fns';
import { getRecordStatus, type RecordStatusInfo } from '@/lib/billing';
import { formatCurrency, toDate } from '@/lib/utils';

type BillReceiptProps = {
  record: StorageRecord;
  customer: Customer;
};

export const BillReceipt = React.forwardRef<HTMLDivElement, BillReceiptProps>(
  ({ record, customer }, ref) => {
    const [statusInfo, setStatusInfo] = useState<RecordStatusInfo | null>(null);
    const [formattedStartDate, setFormattedStartDate] = useState('');
    const [formattedBillDate, setFormattedBillDate] = useState('');

    useEffect(() => {
        const safeRecord = {
            ...record,
            storageStartDate: toDate(record.storageStartDate),
            storageEndDate: record.storageEndDate ? toDate(record.storageEndDate) : null,
        }
        // Hydration safety
        setStatusInfo(getRecordStatus(safeRecord));
        setFormattedStartDate(format(safeRecord.storageStartDate, 'dd MMM yyyy'));
        setFormattedBillDate(format(new Date(), 'dd MMM yyyy'));
    }, [record]);

    if (!statusInfo) return null;

    return (
        <div ref={ref} className="printable-area bg-white p-4">
            <Card className="w-full shadow-none border-0">
                <CardHeader className="text-center">
                    <CardTitle className="text-2xl">Srilakshmi Warehouse</CardTitle>
                    <CardDescription>Billing Statement</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <h3 className="font-semibold mb-2">Customer Details</h3>
                            <p>{customer.name}</p>
                            <p>{customer.address}</p>
                            <p>Phone: {customer.phone}</p>
                        </div>
                         <div>
                            <h3 className="font-semibold mb-2">Billing Details</h3>
                            <p><span className="font-medium">Bill Date:</span> {formattedBillDate}</p>
                            <p><span className="font-medium">Storage Start:</span> {formattedStartDate}</p>
                            <p><span className="font-medium">Commodity:</span> {record.commodityDescription}</p>
                            <p><span className="font-medium">Number of Bags:</span> {record.bagsStored}</p>
                        </div>
                    </div>

                    <Separator />

                    <div>
                        <h3 className="font-semibold mb-2">Current Status & Billing</h3>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span>Current Status</span>
                                <span className="font-medium">{statusInfo.status}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Next Billing Date</span>
                                <span>{statusInfo.nextBillingDate ? format(statusInfo.nextBillingDate, 'dd MMM yyyy') : 'N/A'}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Applicable Rate (per bag)</span>
                                <span>{formatCurrency(statusInfo.currentRate)}</span>
                            </div>
                            {statusInfo.alert && (
                                <div className="flex justify-between text-red-600">
                                    <span className='font-semibold'>Action Required</span>
                                    <span className='font-semibold'>{statusInfo.alert}</span>
                                </div>
                            )}
                        </div>
                    </div>

                     <Separator />

                    <div className="text-xs text-muted-foreground space-y-2">
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
