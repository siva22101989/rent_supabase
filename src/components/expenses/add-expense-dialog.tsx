
'use client';

import { useEffect, useState, useRef } from 'react';
import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { useRouter } from 'next/navigation';
import { Loader2, PlusCircle } from 'lucide-react';
import { SubmitButton } from "@/components/ui/submit-button";
import { addExpense, type FormState } from '@/lib/actions';
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
import { useUnifiedToast } from '@/components/shared/toast-provider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { expenseCategories } from '@/lib/definitions';
import { Textarea } from '../ui/textarea';
import { FormError } from '../shared/form-error';

// Local SubmitButton removed in favor of shared component

export function AddExpenseDialog() {
  const { success: toastSuccess, error: toastError } = useUnifiedToast();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const lastHandledRef = useRef<any>(null);
  
  const initialState: FormState = { message: '', success: false };
  const [state, formAction] = useActionState(addExpense, initialState);

  useEffect(() => {
    if (state.message && state !== lastHandledRef.current) {
      lastHandledRef.current = state;
      if (state.success) {
        toastSuccess('Success', state.message);
        setIsOpen(false);
        router.refresh(); 
      } else {
        toastError('Error', state.message);
      }
    }
  }, [state, toastSuccess, toastError, router]);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>
          <PlusCircle className="mr-2" />
          Add Expense
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <form action={formAction}>
          <DialogHeader>
            <DialogTitle>Add New Expense</DialogTitle>
            <DialogDescription>
              Enter the details for the new expense.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <FormError message={!state.success ? state.message : undefined} />
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input id="date" name="date" type="date" defaultValue={state.data?.date || new Date().toISOString().split('T')[0]} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select name="category" required defaultValue={state.data?.category}>
                <SelectTrigger id="category">
                    <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                    {expenseCategories.map(cat => (
                        <SelectItem key={cat} value={cat}>
                            {cat}
                        </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
             <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
               <Textarea id="description" name="description" placeholder="e.g., Petrol for generator" required defaultValue={state.data?.description} />
            </div>
             <div className="space-y-2">
              <Label htmlFor="amount">Amount</Label>
               <Input id="amount" name="amount" type="number" step="0.01" min="0.01" placeholder="0.00" required defaultValue={state.data?.amount} onFocus={(e) => e.target.select()} onWheel={(e) => e.currentTarget.blur()} />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <SubmitButton>Save Expense</SubmitButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
