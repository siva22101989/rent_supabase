
'use client';

import { useEffect, useState } from 'react';
import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { Loader2 } from 'lucide-react';
import { addPayment, type PaymentFormState } from '@/lib/actions';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import type { StorageRecord } from '@/lib/definitions';
import { format } from 'date-fns';
import { formatCurrency } from '@/lib/utils';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Saving...
        </>
      ) : (
        'Record Transaction'
      )}
    </Button>
  );
}

export function AddPaymentDialog({ record }: { record: StorageRecord & { balanceDue: number } }) {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [paymentType, setPaymentType] = useState<'Rent/Other' | 'Hamali'>('Rent/Other');
  
  const initialState: PaymentFormState = { message: '', success: false };
  const [state, formAction] = useActionState(addPayment, initialState);

  useEffect(() => {
    if (!state.message) return;
    if (state.success) {
      toast({ title: 'Success', description: state.message });
      setIsOpen(false);
    } else {
      toast({
        title: 'Error',
        description: state.message,
        variant: 'destructive',
      });
    }
  }, [state, toast]);
  
  const title = paymentType === 'Hamali' ? 'Add Extra Hamali Charges' : 'Add Payment to Record';
  const description = paymentType === 'Hamali'
    ? `Add an additional hamali charge to record ${record.id}.`
    : `Record a payment for ${record.id}. Balance Due: ${formatCurrency(record.balanceDue)}`;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button size="sm">Add Payment</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <form action={formAction}>
          <input type="hidden" name="recordId" value={record.id} />
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>
              {description}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
             <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Type</Label>
                <RadioGroup 
                    defaultValue="Rent/Other"
                    name="paymentType"
                    className="col-span-3 flex gap-4"
                    onValueChange={(value: 'Rent/Other' | 'Hamali') => setPaymentType(value)}
                >
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="Rent/Other" id="r1" />
                        <Label htmlFor="r1">Payment</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="Hamali" id="r2" />
                        <Label htmlFor="r2">Add Hamali Charge</Label>
                    </div>
                </RadioGroup>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="paymentAmount" className="text-right">
                Amount
              </Label>
              <Input 
                id="paymentAmount" 
                name="paymentAmount" 
                type="number"
                step="0.01"
                min="0.01"
                placeholder="0.00"
                defaultValue={paymentType === 'Rent/Other' ? record.balanceDue.toFixed(2) : undefined}
                className="col-span-3" 
                required 
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="paymentDate" className="text-right">
                Date
              </Label>
              <Input 
                id="paymentDate" 
                name="paymentDate" 
                type="date"
                defaultValue={new Date().toISOString().split('T')[0]}
                className="col-span-3" 
                required 
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <SubmitButton />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
