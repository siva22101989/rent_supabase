
'use client';

import { useActionState, useEffect, useState, useMemo } from 'react';
import { useFormStatus } from 'react-dom';
import { addOutflow, type OutflowFormState } from '@/lib/actions';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Customer, StorageRecord } from '@/lib/definitions';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ArrowUpFromDot } from 'lucide-react';
import { format } from 'date-fns';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { calculateFinalRent } from '@/lib/billing';

function SubmitButton({ disabled }: { disabled?: boolean }) {
    const { pending } = useFormStatus();
    return (
      <Button type="submit" disabled={pending || disabled} className="w-full">
        {pending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing...
          </>
        ) : (
            <>
                <ArrowUpFromDot className="mr-2 h-4 w-4" />
                Confirm Withdrawal
            </>
        )}
      </Button>
    );
}

function getCustomerName(customerId: string, customers: Customer[]) {
    return customers.find(c => c.id === customerId)?.name ?? 'Unknown';
}

function formatCurrency(amount: number) {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 2,
    }).format(amount);
}


export function OutflowForm({ records, customers }: { records: StorageRecord[], customers: Customer[] }) {
    const { toast } = useToast();
    const initialState: OutflowFormState = { message: '', success: false };
    const [state, formAction] = useActionState(addOutflow, initialState);
    
    const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);
    const [bagsToWithdraw, setBagsToWithdraw] = useState<number | string>('');

    const selectedRecord = useMemo(() => records.find(r => r.id === selectedRecordId), [records, selectedRecordId]);

    const bagsToWithdrawNum = useMemo(() => {
        const num = Number(bagsToWithdraw);
        return isNaN(num) ? 0 : num;
    }, [bagsToWithdraw]);

    const isWithdrawalInvalid = useMemo(() => {
        if (!selectedRecord) return false;
        return bagsToWithdrawNum > selectedRecord.bagsStored;
    }, [bagsToWithdrawNum, selectedRecord]);

    const additionalRent = useMemo(() => {
        if (!selectedRecord || bagsToWithdrawNum <= 0) return 0;
        return calculateFinalRent(selectedRecord, new Date(), bagsToWithdrawNum).rent;
    }, [selectedRecord, bagsToWithdrawNum]);
    
    const pendingHamali = useMemo(() => {
        if (!selectedRecord || !selectedRecord.bagsStored || bagsToWithdrawNum <= 0) return 0;
        // Hamali is charged on inflow, so this is just for display if needed.
        // Assuming we want to show hamali associated with the bags being withdrawn.
        const hamaliPerBag = selectedRecord.hamaliCharges / selectedRecord.bagsStored;
        return hamaliPerBag * bagsToWithdrawNum;
    }, [selectedRecord, bagsToWithdrawNum]);


    useEffect(() => {
        if (state.message) {
            if (state.success) {
                // Redirect is handled by the server action, so a toast might not be seen.
            } else {
                toast({
                    title: 'Error',
                    description: state.message,
                    variant: 'destructive',
                });
            }
        }
    }, [state, toast]);

    useEffect(() => {
        if (selectedRecord) {
            setBagsToWithdraw(selectedRecord.bagsStored);
        } else {
            setBagsToWithdraw('');
        }
    }, [selectedRecord]);

  return (
    <div className="flex justify-center">
        <form action={formAction} className="w-full max-w-2xl">
            <Card>
                <CardHeader>
                    <CardTitle>Withdraw Storage Record</CardTitle>
                    <CardDescription>Select a record to process for outflow and billing.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-2">
                        <Label>Select Record</Label>
                        <Select name="recordId" required onValueChange={(value) => setSelectedRecordId(value)}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select an active storage record" />
                            </SelectTrigger>
                            <SelectContent>
                                {records.map(record => (
                                    <SelectItem key={record.id} value={record.id}>
                                        {getCustomerName(record.customerId, customers)} - {record.commodityDescription} ({record.bagsStored} bags) - In: {format(record.storageStartDate, 'dd MMM yyyy')}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {selectedRecord && (
                        <>
                            <Card className="bg-muted/50">
                                <CardHeader>
                                    <CardTitle className='text-lg'>Record Details</CardTitle>
                                </CardHeader>
                                <CardContent className="grid sm:grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <p className="font-medium">Customer</p>
                                        <p className="text-muted-foreground">{getCustomerName(selectedRecord.customerId, customers)}</p>
                                    </div>
                                    <div>
                                        <p className="font-medium">Commodity</p>
                                        <p className="text-muted-foreground">{selectedRecord.commodityDescription}</p>
                                    </div>
                                    <div>
                                        <p className="font-medium">Balance Bags</p>
                                        <p className="text-muted-foreground">{selectedRecord.bagsStored}</p>
                                    </div>
                                    <div>
                                        <p className="font-medium">Storage Start Date</p>
                                        <p className="text-muted-foreground">{format(selectedRecord.storageStartDate, 'dd MMM yyyy')}</p>
                                    </div>
                                </CardContent>
                            </Card>

                            <div className="space-y-2">
                                <Label htmlFor="bagsToWithdraw">Bags to Withdraw</Label>
                                <Input 
                                    id="bagsToWithdraw" 
                                    name="bagsToWithdraw" 
                                    type="number" 
                                    value={bagsToWithdraw}
                                    onChange={(e) => {
                                        const value = Number(e.target.value);
                                        if (selectedRecord && value > selectedRecord.bagsStored) {
                                            setBagsToWithdraw(selectedRecord.bagsStored);
                                        } else {
                                            setBagsToWithdraw(value < 0 ? 0 : value);
                                        }
                                    }}
                                    max={selectedRecord.bagsStored}
                                    min={1}
                                    placeholder="Enter number of bags"
                                    required
                                />
                                {isWithdrawalInvalid && (
                                    <p className="text-sm text-red-600">Cannot withdraw more than the available balance of {selectedRecord.bagsStored} bags.</p>
                                )}
                            </div>

                            <Card className="bg-green-50 border-green-200">
                                <CardHeader>
                                    <CardTitle className='text-lg text-green-900'>Billing Summary</CardTitle>
                                </CardHeader>
                                <CardContent className='space-y-3 text-green-800'>
                                     <div className="flex justify-between items-center font-medium">
                                        <span>Pending Hamali Amount:</span>
                                        <span className='font-mono'>{formatCurrency(pendingHamali)}</span>
                                    </div>
                                    <div className="flex justify-between items-center font-medium">
                                        <span>Additional Rent Due:</span>
                                        <span className='font-mono'>{formatCurrency(additionalRent)}</span>
                                    </div>
                                    <div className="flex justify-between items-center font-bold text-lg border-t border-green-300 pt-3 mt-3">
                                        <span>Total Amount Due:</span>
                                        <span className='font-mono'>{formatCurrency(pendingHamali + additionalRent)}</span>
                                    </div>

                                </CardContent>
                            </Card>
                        </>
                    )}

                </CardContent>
                <CardFooter>
                    <SubmitButton disabled={!selectedRecord || bagsToWithdrawNum <= 0 || isWithdrawalInvalid} />
                </CardFooter>
            </Card>
        </form>
    </div>
  );
}
