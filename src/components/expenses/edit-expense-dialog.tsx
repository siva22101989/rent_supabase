
'use client';

import { useEffect, useState, useRef } from 'react';
import { useActionState } from 'react';

import { SubmitButton } from "@/components/ui/submit-button";
import { type FormState } from '@/lib/actions/common';
import { updateExpenseAction } from '@/lib/actions/expenses';
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
import type { Expense } from '@/lib/definitions';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { expenseCategories } from '@/lib/definitions';
import { Textarea } from '../ui/textarea';
import { format } from 'date-fns';
import { toDate } from '@/lib/utils';

// Local SubmitButton removed in favor of shared component

export function EditExpenseDialog({ expense, children }: { expense: Expense, children: React.ReactNode }) {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const lastHandledRef = useRef<any>(null);
  
  const initialState: FormState = { message: '', success: false };
  const updateAction = updateExpenseAction.bind(null, expense.id);
  const [state, formAction] = useActionState(updateAction, initialState);

  useEffect(() => {
    if (state.message && state !== lastHandledRef.current) {
      lastHandledRef.current = state;
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
    }
  }, [state, toast]);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <form action={formAction}>
          <DialogHeader>
            <DialogTitle>Edit Expense</DialogTitle>
            <DialogDescription>
              Update the details for this expense.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
             <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input id="date" name="date" type="date" defaultValue={state.data?.date || format(toDate(expense.date), 'yyyy-MM-dd')} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select name="category" defaultValue={state.data?.category || expense.category} required>
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
               <Textarea id="description" name="description" defaultValue={state.data?.description || expense.description} required />
            </div>
             <div className="space-y-2">
              <Label htmlFor="amount">Amount</Label>
               <Input id="amount" name="amount" type="number" step="0.01" defaultValue={state.data?.amount || expense.amount} required onFocus={(e) => e.target.select()} onWheel={(e) => e.currentTarget.blur()} />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <SubmitButton>Save Changes</SubmitButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
