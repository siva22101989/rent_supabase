
'use client';

import { useActionState, useEffect, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { SubmitButton } from "@/components/ui/submit-button";
import { addOutflow, type OutflowFormState } from '@/lib/actions';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Customer, StorageRecord } from '@/lib/definitions';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { Separator } from '../ui/separator';
import { calculateFinalRent } from '@/lib/billing';
import { format } from 'date-fns';
import { toDate } from '@/lib/utils';

// Local SubmitButton removed in favor of shared component


export function OutflowForm({ records, customers, crops }: { records: StorageRecord[], customers: Customer[], crops?: any[] }) {
    const { toast } = useToast();
    const initialState: OutflowFormState = { message: '', success: false };
    const [state, formAction] = useActionState(addOutflow, initialState);

    const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
    const [selectedRecordId, setSelectedRecordId] = useState<string>('');
    const [bagsToWithdraw, setBagsToWithdraw] = useState(0);
    const [withdrawalDate, setWithdrawalDate] = useState(new Date());
    
    const [finalRent, setFinalRent] = useState(0);
    const [storageMonths, setStorageMonths] = useState(0);
    const [rentPerBag, setRentPerBag] = useState({ rentPerBag: 0 });
    const [hamaliPending, setHamaliPending] = useState(0);

    const filteredRecords = selectedCustomerId ? records.filter(r => r.customerId === selectedCustomerId) : [];
    const selectedRecord = records.find(r => r.id === selectedRecordId);
    const totalPayable = finalRent + hamaliPending;

    useEffect(() => {
        if (state.message) {
            if (state.success) {
                // Redirect is handled by the action, no toast needed for success
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
    
    const handleCustomerChange = (customerId: string) => {
        setSelectedCustomerId(customerId);
        setSelectedRecordId('');
        setBagsToWithdraw(0);
        setFinalRent(0);
        setStorageMonths(0);
        setRentPerBag({ rentPerBag: 0 });
        setHamaliPending(0);
    }

    const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const dateValue = e.target.valueAsDate ? new Date(e.target.valueAsDate.valueOf() + e.target.valueAsDate.getTimezoneOffset() * 60 * 1000) : new Date();
        setWithdrawalDate(dateValue);
    }

  return (
    <div className="flex justify-center">
        <form action={formAction} className="w-full max-w-lg">
            <Card>
                <CardHeader>
                <CardTitle>Withdrawal Details</CardTitle>
                <CardDescription>Select a customer, then choose a record and enter withdrawal information.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="customerId">Customer</Label>
                        <Select onValueChange={handleCustomerChange} required>
                            <SelectTrigger id="customerId">
                                <SelectValue placeholder="Select a customer..." />
                            </SelectTrigger>
                            <SelectContent>
                                {customers.map(customer => (
                                    <SelectItem key={customer.id} value={customer.id}>
                                        {customer.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {selectedCustomerId && (
                        <div className="space-y-2">
                            <Label htmlFor="recordId">Storage Record</Label>
                            <Select name="recordId" onValueChange={setSelectedRecordId} value={selectedRecordId} required>
                                <SelectTrigger id="recordId">
                                    <SelectValue placeholder="Select a record..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {filteredRecords.length > 0 ? filteredRecords.map(record => (
                                        <SelectItem key={record.id} value={record.id}>
                                            {record.id} - ({record.commodityDescription})
                                        </SelectItem>
                                    )) : (
                                        <SelectItem value="none" disabled>No active records for this customer</SelectItem>
                                    )}
                                </SelectContent>
                            </Select>
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
                                        defaultValue={new Date().toISOString().split('T')[0]}
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
