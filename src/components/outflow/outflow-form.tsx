'use client';

import { useActionState, useEffect, useState, useRef } from 'react';
import { useFormStatus } from 'react-dom';
import { useRouter } from 'next/navigation';
import * as Sentry from "@sentry/nextjs";
import { SubmitButton } from "@/components/ui/submit-button";
import { addOutflow, type OutflowFormState } from '@/lib/actions';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Customer, StorageRecord } from '@/lib/definitions';
import { useUnifiedToast } from '@/components/shared/toast-provider';
import { FormError } from '../shared/form-error';
import { Separator } from '../ui/separator';
import { calculateFinalRent } from '@/lib/billing';
import { format } from 'date-fns';
import { toDate } from '@/lib/utils';
import { Loader2 } from 'lucide-react';
import { useCustomers } from '@/contexts/customer-context';
import { useStaticData } from '@/hooks/use-static-data';

import { AsyncRecordSelector } from './async-record-selector';
import { getStorageRecordAction } from '@/lib/actions';

export function OutflowForm({ 
    records = [],
    onSuccess
}: { 
    records?: StorageRecord[],
    onSuccess?: (outflow: any) => void
}) {
    const { success: toastSuccess, error: toastError } = useUnifiedToast();
    const initialState: OutflowFormState = { message: '', success: false };
    const [state, formAction] = useActionState(addOutflow, initialState);

    // Hooks for data
    const { customers, isLoading: customersLoading } = useCustomers();
    const { crops, loading: cropsLoading, refresh } = useStaticData(); 
    const router = useRouter();
    const lastHandledRef = useRef<any>(null);
    
    // Derived loading state if needed, but we can just show skeletal UI or wait.
    // For now we render selectors empty until loaded.

    const [selectedRecordId, setSelectedRecordId] = useState<string>('');
    const [selectedRecord, setSelectedRecord] = useState<StorageRecord | null>(null);
    const [bagsToWithdraw, setBagsToWithdraw] = useState(0);
    const [withdrawalDate, setWithdrawalDate] = useState(new Date());
    
    const [finalRent, setFinalRent] = useState(0);
    const [storageMonths, setStorageMonths] = useState(0);
    const [rentPerBag, setRentPerBag] = useState({ rentPerBag: 0 });
    const [hamaliPending, setHamaliPending] = useState(0);
    const [isLoadingRecord, setIsLoadingRecord] = useState(false);

    // Filtered logic removed in favor of Async Search
    const totalPayable = finalRent + hamaliPending;

    const handleRecordSelect = async (recordId: string) => {
        setSelectedRecordId(recordId);
        if(!recordId) {
             setSelectedRecord(null);
             return;
        }

        setIsLoadingRecord(true);
        try {
            const record = await getStorageRecordAction(recordId);
            if(record) {
                setSelectedRecord(record);
                // Auto-set customer ID format compatibility if needed by action
                // But action likely uses hidden inputs or state
            }
        } catch(e) {
            toastError("Error", "Failed to load record details");
        } finally {
            setIsLoadingRecord(false);
        }
    };

    // Auto-restoration from state.data on error
    useEffect(() => {
        if (state.data) {
             // If we have an error and state returns data, we technically need to re-fetch the record to show the form again 
             // or rely on what's already selected.
             // Ideally we shouldn't lose state on server action error if we prevent default reset.
             if (state.data.recordId && state.data.recordId !== selectedRecordId) {
                  handleRecordSelect(state.data.recordId);
             }
             if (state.data.bagsToWithdraw) setBagsToWithdraw(Number(state.data.bagsToWithdraw));
            if (state.data.withdrawalDate) setWithdrawalDate(new Date(state.data.withdrawalDate));
        }
    }, [state.data]);

    useEffect(() => {
        if (state.message && state !== lastHandledRef.current) {
            lastHandledRef.current = state;

            Sentry.withScope((scope) => {
                scope.setTag("form", "outflow");
                scope.setExtra("success", state.success);

                if (state.success) {
                    // Redirect is handled by the action, no toast needed for success
                    const initRefresh = async () => {
                        await Sentry.startSpan(
                            { name: "outflow-success-refresh", op: "ui.action.refresh" },
                            async () => {
                                await refresh();
                                router.refresh();
                            }
                        );
                    };
                    initRefresh();
                } else {
                    toastError('Error', state.message);
                }
            });
        }
    }, [state, toastError, refresh, router]);

    useEffect(() => {
        if (selectedRecord) {
            const amountPaid = (selectedRecord.payments || []).reduce((acc, p) => acc + p.amount, 0);
            const pending = selectedRecord.hamaliPayable - amountPaid;
            setHamaliPending(pending > 0 ? pending : 0);
            
            const safeRecord = {
                ...selectedRecord,
                storageStartDate: toDate(selectedRecord.storageStartDate)
            };

            // Find crop pricing if available
            let pricing = undefined;
            if (selectedRecord.cropId && crops) {
                const crop = crops.find(c => c.id === selectedRecord.cropId);
                if (crop) {
                    pricing = {
                        price6m: crop.rent_price_6m,
                        price1y: crop.rent_price_1y
                    };
                }
            }

            if (bagsToWithdraw > 0) {
                const { rent, monthsStored, rentPerBag: rentPerBagCalc } = calculateFinalRent(safeRecord, withdrawalDate, bagsToWithdraw, pricing);
                setFinalRent(rent);
                setStorageMonths(monthsStored);
                setRentPerBag({ rentPerBag: rentPerBagCalc });
            } else {
                setFinalRent(0);
                setStorageMonths(0);
                setRentPerBag({ rentPerBag: 0 });
            }
        } else {
            setFinalRent(0);
            setStorageMonths(0);
            setRentPerBag({ rentPerBag: 0 });
            setHamaliPending(0);
        }
    }, [selectedRecord, bagsToWithdraw, withdrawalDate, crops]);
    
    // Removed handleCustomerChange


    const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const dateValue = e.target.valueAsDate ? new Date(e.target.valueAsDate.valueOf() + e.target.valueAsDate.getTimezoneOffset() * 60 * 1000) : new Date();
        setWithdrawalDate(dateValue);
    }

   const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        // Basic prediction for optimistic UI
        if (onSuccess && selectedRecord) {
            onSuccess({
                id: 'optimistic-' + Date.now(),
                date: withdrawalDate,
                customerName: selectedRecord.customerName || 'Customer', // Corrected property name
                commodity: selectedRecord.commodityDescription || 'Product',
                bags: bagsToWithdraw,
                totalAmount: totalPayable
            });
        }
    };

  return (
    <div className="flex justify-center">
        <form action={formAction} onSubmit={handleSubmit} className="w-full max-w-lg">
            <Card>
                <CardHeader>
                <CardTitle>Withdrawal Details</CardTitle>
                <CardDescription>Select a customer, then choose a record and enter withdrawal information.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Standardized Error Alert */}
                    <FormError message={!state.success ? state.message : undefined} className="mb-4" />
                    <div className="space-y-2">
                        <Label>Search Record</Label>
                        <AsyncRecordSelector onSelect={handleRecordSelect} />
                        {/* Hidden Inputs for Form Action */}
                        <input type="hidden" name="customerId" value={selectedRecord?.customerId || ''} />
                        <input type="hidden" name="recordId" value={selectedRecordId} />
                    </div>
                    
                    {isLoadingRecord && (
                        <div className="flex justify-center p-4 text-muted-foreground text-sm">
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Loading details...
                        </div>
                    )}


                    {selectedRecord && (
                        <>
                             <div className="text-sm text-muted-foreground p-2 bg-secondary/50 rounded-md">
                                Inflow Date: <span className="font-medium text-foreground">{format(toDate(selectedRecord.storageStartDate), 'dd MMM yyyy')}</span>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="bagsToWithdraw">Bags to Withdraw</Label>
                                    <Input 
                                        id="bagsToWithdraw" 
                                        name="bagsToWithdraw" 
                                        type="number" 
                                        placeholder="0"
                                        min="1"
                                        max={selectedRecord.bagsStored}
                                        required 
                                        defaultValue={state.data?.bagsToWithdraw}
                                        onFocus={(e) => e.target.select()}
                                        onWheel={(e) => e.currentTarget.blur()}
                                        onChange={e => setBagsToWithdraw(Number(e.target.value))}
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        Max: {selectedRecord.bagsStored} bags
                                    </p>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="withdrawalDate">Withdrawal Date</Label>
                                    <Input 
                                        id="withdrawalDate" 
                                        name="withdrawalDate" 
                                        type="date"
                                        defaultValue={state.data?.withdrawalDate || new Date().toISOString().split('T')[0]}
                                        required
                                        onChange={handleDateChange}
                                     />
                                </div>
                            </div>
                            <Separator />
                            <div className="space-y-4">
                                <h4 className="font-medium">Final Billing Summary</h4>
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-muted-foreground">Storage Duration</span>
                                        <span className="font-mono">{storageMonths} months</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-muted-foreground">Rent Due for {bagsToWithdraw} bags</span>
                                        <span className="font-mono">₹{finalRent.toFixed(2)}</span>
                                    </div>
                                     <div className="flex justify-between items-center text-sm">
                                        <span className="text-muted-foreground">Pending Hamali Charges</span>
                                        <span className="font-mono">₹{hamaliPending.toFixed(2)}</span>
                                    </div>
                                    <Separator />
                                    <div className="flex justify-between items-center font-semibold text-lg">
                                        <span className="text-foreground">Total Payable</span>
                                        <span className="font-mono">₹{totalPayable.toFixed(2)}</span>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="amountPaidNow">Total Paid Now</Label>
                                        <Input
                                            id="amountPaidNow"
                                            name="amountPaidNow"
                                            type="number"
                                            placeholder="0.00"
                                            step="0.01"
                                            min="0"
                                            max={totalPayable.toFixed(2)}
                                            onFocus={(e) => e.target.select()}
                                            onWheel={(e) => e.currentTarget.blur()}
                                            defaultValue={state.data?.amountPaidNow}
                                        />
                                        <p className="text-xs text-muted-foreground">
                                            Enter the amount paid by the customer. Leave blank if unpaid.
                                        </p>
                                    </div>
                                </div>
                                <input type="hidden" name="finalRent" value={finalRent} />
                            </div>
                        </>
                    )}
                </CardContent>
                <CardFooter>
                    <SubmitButton className="w-full">Process Outflow</SubmitButton>
                </CardFooter>
            </Card>
        </form>
    </div>
  );
}
