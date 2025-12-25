'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatCurrency } from '@/lib/utils';
import { format } from 'date-fns';
import { AddPaymentDialog } from './add-payment-dialog';
import { Loader2, CreditCard } from 'lucide-react';
import { getCustomerRecordsAction } from '@/lib/actions';
import type { StorageRecord } from '@/lib/definitions';

interface RecordPaymentDialogProps {
    customer: {
        id: string;
        name: string;
        balance: number;
    };
}

export function RecordPaymentDialog({ customer }: RecordPaymentDialogProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [records, setRecords] = useState<StorageRecord[]>([]);
    const [selectedRecord, setSelectedRecord] = useState<(StorageRecord & { balanceDue: number }) | null>(null);

    const handleOpen = async () => {
        setIsOpen(true);
        setIsLoading(true);
        
        try {
            const allRecords = await getCustomerRecordsAction(customer.id);
            const activeRecords = allRecords.filter((r: any) => !r.storageEndDate);
            setRecords(activeRecords);
        } catch (error) {
            console.error('Error fetching records:', error);
            alert('Failed to load customer records');
            setIsOpen(false);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSelectRecord = (record: StorageRecord) => {
        // Calculate balance for this specific record
        const payments = record.payments || [];
        const totalPaid = payments.reduce((sum: number, p: any) => sum + p.amount, 0);
        const totalBilled = (record.totalRentBilled || 0) + (record.hamaliPayable || 0);
        const balanceDue = totalBilled - totalPaid;

        setSelectedRecord({
            ...record,
            balanceDue
        });
    };

    return (
        <>
            <Button 
                size="sm"
                onClick={handleOpen}
            >
                <CreditCard className="mr-2 h-4 w-4" />
                Record Payment
            </Button>

            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Select Record for Payment - {customer.name}</DialogTitle>
                        <DialogDescription>
                            Choose which storage record you want to record a payment for.
                        </DialogDescription>
                    </DialogHeader>

                    {isLoading ? (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                    ) : records.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            No active storage records found for this customer.
                        </div>
                    ) : (
                        <div className="border rounded-md">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Record #</TableHead>
                                        <TableHead>Date In</TableHead>
                                        <TableHead>Commodity</TableHead>
                                        <TableHead className="text-right">Bags</TableHead>
                                        <TableHead className="text-right">Billed</TableHead>
                                        <TableHead className="text-right">Paid</TableHead>
                                        <TableHead className="text-right">Balance</TableHead>
                                        <TableHead className="text-right">Action</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {records.map((record: any) => {
                                        const payments = record.payments || [];
                                        const totalPaid = payments.reduce((sum: number, p: any) => sum + p.amount, 0);
                                        const totalBilled = (record.totalRentBilled || 0) + (record.hamaliPayable || 0);
                                        const balance = totalBilled - totalPaid;

                                        return (
                                            <TableRow key={record.id}>
                                                <TableCell className="font-medium font-mono">
                                                    {record.recordNumber || record.id.substring(0, 8)}
                                                </TableCell>
                                                <TableCell>
                                                    {format(new Date(record.storageStartDate), 'dd MMM yyyy')}
                                                </TableCell>
                                                <TableCell>{record.commodityDescription || '-'}</TableCell>
                                                <TableCell className="text-right">{record.bagsStored}</TableCell>
                                                <TableCell className="text-right">{formatCurrency(totalBilled)}</TableCell>
                                                <TableCell className="text-right text-green-600">{formatCurrency(totalPaid)}</TableCell>
                                                <TableCell className="text-right font-medium">
                                                    {formatCurrency(balance)}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Button
                                                        size="sm"
                                                        onClick={() => handleSelectRecord(record)}
                                                        disabled={balance <= 0}
                                                    >
                                                        Pay
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Payment Dialog */}
            {selectedRecord && (
                <AddPaymentDialog 
                    record={selectedRecord}
                    autoOpen={true}
                    onClose={() => {
                        setSelectedRecord(null);
                        setIsOpen(false);
                    }}
                />
            )}
        </>
    );
}
