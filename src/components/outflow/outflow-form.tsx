
'use client';

import { useActionState, useEffect, useState } from 'react';
import { useFormStatus } from 'react-dom';
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
import { calculateFinalRent, RATE_1_YEAR, RATE_6_MONTHS } from '@/lib/billing';
import { differenceInMonths } from 'date-fns';

function SubmitButton() {
    const { pending } = useFormStatus();
    return (
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing...
          </>
        ) : (
          'Process Withdrawal and Generate Bill'
        )}
      </Button>
    );
}

export function OutflowForm({ records, customers }: { records: StorageRecord[], customers: Customer[] }) {
    const { toast } = useToast();
    const initialState: OutflowFormState = { message: '', success: false };
    const [state, formAction] = useActionState(addOutflow, initialState);

    const [selectedRecordId, setSelectedRecordId] = useState<string>('');
    const [bagsToWithdraw, setBagsToWithdraw] = useState(0);
    const [withdrawalDate, setWithdrawalDate] = useState(new Date());
    
    const [finalRent, setFinalRent] = useState(0);
    const [storageMonths, setStorageMonths] = useState(0);
    const [rentPerBag, setRentPerBag] = useState({ totalOwed: 0, alreadyPaid: 0 });

    const selectedRecord = records.find(r => r.id === selectedRecordId);

    useEffect(() => {
        if (state.message) {
            if (state.success) {
                toast({
                    title: 'Success!',
                    description: state.message,
                });
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
        if (selectedRecord && bagsToWithdraw > 0) {
            const { rent, monthsStored, totalRentOwedPerBag, rentAlreadyPaidPerBag } = calculateFinalRent(selectedRecord, withdrawalDate, bagsToWithdraw);
            setFinalRent(rent);
            setStorageMonths(monthsStored);
            setRentPerBag({ totalOwed: totalRentOwedPerBag, alreadyPaid: rentAlreadyPaidPerBag });
        } else {
            setFinalRent(0);
            setStorageMonths(0);
            setRentPerBag({ totalOwed: 0, alreadyPaid: 0 });
        }
    }, [selectedRecord, bagsToWithdraw, withdrawalDate]);

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
                <CardDescription>Select a record and enter withdrawal information.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="recordId">Storage Record</Label>
                        <Select name="recordId" required onValueChange={setSelectedRecordId}>
                            <SelectTrigger id="recordId">
                                <SelectValue placeholder="Select a record..." />
                            </SelectTrigger>
                            <SelectContent>
                                {records.map(record => {
                                    const customer = customers.find(c => c.id === record.customerId);
                                    return (
                                        <SelectItem key={record.id} value={record.id}>
                                            {record.id} - {customer?.name} ({record.commodityDescription})
                                        </SelectItem>
                                    )
                                })}
                            </SelectContent>
                        </Select>
                    </div>

                    {selectedRecord && (
                        <>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="bagsToWithdraw">Bags to Withdraw</Label>
                                    <Input 
                                        id="bagsToWithdraw" 
                                        name="bagsToWithdraw" 
                                        type="number" 
                                        placeholder="0"
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
                                        <span className="text-muted-foreground">Total Rent Owed / bag</span>
                                        <span className="font-mono">₹{rentPerBag.totalOwed.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-muted-foreground">Rent Already Paid / bag</span>
                                        <span className="font-mono">- ₹{rentPerBag.alreadyPaid.toFixed(2)}</span>
                                    </div>
                                     <div className="flex justify-between items-center text-sm">
                                        <span className="text-muted-foreground">Additional Rent Due / bag</span>
                                        <span className="font-mono">₹{(rentPerBag.totalOwed - rentPerBag.alreadyPaid).toFixed(2)}</span>
                                    </div>
                                     <div className="flex justify-between items-center text-sm">
                                        <span className="text-muted-foreground">Bags Withdrawing</span>
                                        <span className="font-mono">x {bagsToWithdraw}</span>
                                    </div>
                                    <Separator />
                                    <div className="flex justify-between items-center font-semibold text-base">
                                        <span className="text-foreground">Total Amount Payable Now</span>
                                        <span className="font-mono">₹{finalRent.toFixed(2)}</span>
                                    </div>
                                </div>
                                <input type="hidden" name="finalRent" value={finalRent} />
                            </div>
                        </>
                    )}
                </CardContent>
                <CardFooter>
                    <SubmitButton />
                </CardFooter>
            </Card>
        </form>
    </div>
  );
}
