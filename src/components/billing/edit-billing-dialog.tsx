
'use client';

import { useEffect, useState, useTransition } from 'react';
import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { Loader2 } from 'lucide-react';
import { updateBillingRecord, type BillingFormState } from '@/lib/actions';
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
        'Save Changes'
      )}
    </Button>
  );
}

export function EditBillingDialog({ record, children }: { record: StorageRecord, children: React.ReactNode }) {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  
  const initialState: BillingFormState = { message: '', success: false };
  const [state, formAction] = useActionState(updateBillingRecord, initialState);

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
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <form action={formAction}>
          <input type="hidden" name="recordId" value={record.id} />
          <DialogHeader>
            <DialogTitle>Edit Billing Record</DialogTitle>
            <DialogDescription>
              Adjust the details for record {record.id}.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="amountPaid" className="text-right">
                Amount Paid
              </Label>
              <Input 
                id="amountPaid" 
                name="amountPaid" 
                type="number"
                step="0.01"
                defaultValue={record.amountPaid} 
                className="col-span-3" 
                required 
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="storageEndDate" className="text-right">
                Date Out
              </Label>
              <Input 
                id="storageEndDate" 
                name="storageEndDate" 
                type="date"
                defaultValue={record.storageEndDate ? format(record.storageEndDate, 'yyyy-MM-dd') : ''}
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
