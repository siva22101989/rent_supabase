
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
        'Add Payment'
      )}
    </Button>
  );
}

export function AddPaymentDialog({ record }: { record: StorageRecord & { balanceDue: number } }) {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  
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

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button size="sm">Add Payment</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <form action={formAction}>
          <input type="hidden" name="recordId" value={record.id} />
          <DialogHeader>
            <DialogTitle>Add Payment to Record</DialogTitle>
            <DialogDescription>
              Record ID: {record.id}. Balance Due: <span className="font-mono text-destructive">₹{record.balanceDue.toFixed(2)}</span>
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="paymentAmount" className="text-right">
                Amount
              </Label>
              <Input 
                id="paymentAmount" 
                name="paymentAmount" 
                type="number"
                step="0.01"
                placeholder="0.00"
                defaultValue={record.balanceDue.toFixed(2)}
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
