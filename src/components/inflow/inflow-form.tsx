
'use client';

import { useActionState, useEffect, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { addInflow, type InflowFormState } from '@/lib/actions';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Customer } from '@/lib/definitions';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { Separator } from '../ui/separator';

function SubmitButton() {
    const { pending } = useFormStatus();
    return (
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Saving...
          </>
        ) : (
          'Create Storage Record'
        )}
      </Button>
    );
}

export function InflowForm({ customers }: { customers: Customer[] }) {
    const { toast } = useToast();
    const initialState: InflowFormState = { message: '', success: false };
    const [state, formAction] = useActionState(addInflow, initialState);

    const [bags, setBags] = useState(0);
    const [rate, setRate] = useState(0);
    const [hamali, setHamali] = useState(0);
    const [hamaliPaid, setHamaliPaid] = useState(0);

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
        const bagsValue = bags || 0;
        const rateValue = rate || 0;
        
        const calculatedHamali = bagsValue * rateValue;
        setHamali(calculatedHamali);
    }, [bags, rate]);


  return (
    <div className="flex justify-center">
        <form action={formAction} className="w-full max-w-lg">
            <Card>
                <CardHeader>
                <CardTitle>New Storage Record Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="customerId">Customer</Label>
                        <Select name="customerId" required>
                            <SelectTrigger id="customerId">
                                <SelectValue placeholder="Select a customer" />
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
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="commodityDescription">Commodity</Label>
                            <Input id="commodityDescription" name="commodityDescription" placeholder="e.g., Wheat, Rice" required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="location">Location</Label>
                            <Input id="location" name="location" placeholder="e.g., Aisle 3, Rack 2" required />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="bagsStored">Number of Bags</Label>
                            <Input id="bagsStored" name="bagsStored" type="number" placeholder="0" required onChange={e => setBags(Number(e.target.value))}/>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="hamaliRate">Hamali Rate (per bag)</Label>
                            <Input id="hamaliRate" name="hamaliRate" type="number" placeholder="0.00" step="0.01" required onChange={e => setRate(Number(e.target.value))}/>
                        </div>
                    </div>
                     <Separator />
                    <div className="space-y-4">
                        <h4 className="font-medium">Billing Summary</h4>
                        <div className="space-y-2">
                             <div className="flex justify-between items-center text-sm">
                                <span className="text-muted-foreground">Total Hamali Payable</span>
                                <span className="font-mono">₹{hamali.toFixed(2)}</span>
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="hamaliPaid">Hamali Paid Now</Label>
                                <Input id="hamaliPaid" name="hamaliPaid" type="number" placeholder="0.00" step="0.01" required onChange={e => setHamaliPaid(Number(e.target.value))}/>
                            </div>
                            <div className="flex justify-between items-center font-semibold text-base">
                                <span className="text-destructive">Hamali Pending</span>
                                <span className="font-mono text-destructive">₹{(hamali - hamaliPaid).toFixed(2)}</span>
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Rent will be calculated at the time of withdrawal.
                            </p>
                        </div>
                    </div>
                </CardContent>
                <CardFooter>
                    <SubmitButton />
                </CardFooter>
            </Card>
        </form>
    </div>
  );
}
