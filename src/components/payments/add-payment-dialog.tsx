
'use client';

import { useEffect, useState, useRef } from 'react';
import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { SubmitButton } from "@/components/ui/submit-button";
import { addPayment, type PaymentFormState } from '@/lib/actions/payments';
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
import { FormError } from '../shared/form-error';
import type { StorageRecord } from '@/lib/definitions';
import { format } from 'date-fns';
import { formatCurrency } from '@/lib/utils';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';

// Local SubmitButton removed in favor of shared component

export function AddPaymentDialog({ record, onClose, autoOpen = false }: { 
  record: StorageRecord & { balanceDue: number };
  onClose?: () => void;
  autoOpen?: boolean;
}) {
  const { success: toastSuccess, error: toastError } = useUnifiedToast();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(autoOpen);
  const [paymentType, setPaymentType] = useState<'Rent/Other' | 'Hamali'>('Rent/Other');
  const lastHandledRef = useRef<any>(null);
  
  const initialState: PaymentFormState = { message: '', success: false };
  const [state, formAction] = useActionState(addPayment, initialState);

  // Auto-restoration from state.data on error
  useEffect(() => {
    if (state.data) {
      if (state.data.paymentType) setPaymentType(state.data.paymentType);
    }
  }, [state.data]);

  useEffect(() => {
    if (state.message && state !== lastHandledRef.current) {
      lastHandledRef.current = state;
      if (state.success) {
        toastSuccess('Success', state.message);
        setIsOpen(false);
        onClose?.();
        router.refresh();
      } else {
        router.refresh();
        toastError('Error', state.message);
      }
    }
  }, [state, toastSuccess, toastError, router, onClose]);
  
  const recordDisplay = record.recordNumber || `REC-${record.id.substring(0, 8)}`;
  const title = paymentType === 'Hamali' ? 'Add Extra Hamali Charges' : 'Record Payment';
  const description = paymentType === 'Hamali'
    ? `Add an additional hamali charge to ${recordDisplay}.`
    : `Record a payment for ${recordDisplay}. Balance Due: ${formatCurrency(record.balanceDue)}`;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      setIsOpen(open);
      if (!open) onClose?.();
    }}>
      {!autoOpen && (
        <DialogTrigger asChild>
          <Button size="sm">Add Payment</Button>
        </DialogTrigger>
      )}
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
            <FormError message={!state.success ? state.message : undefined} />
            <div className="grid gap-2">
                <Label>Type</Label>
                <RadioGroup 
                    defaultValue={state.data?.paymentType || "Rent/Other"}
                    name="paymentType"
                    className="flex gap-4"
                    value={paymentType}
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
            <div className="grid gap-2">
              <Label htmlFor="paymentAmount">
                Amount
              </Label>
              <Input 
                id="paymentAmount" 
                name="paymentAmount" 
                type="number"
                step="0.01"
                min="0.01"
                max={paymentType === 'Rent/Other' ? record.balanceDue : undefined}
                placeholder={paymentType === 'Rent/Other' ? `Max: ${formatCurrency(record.balanceDue)}` : "Enter amount"}
                defaultValue={state.data?.paymentAmount}
                onFocus={(e) => e.target.select()}
                onWheel={(e) => e.currentTarget.blur()}
                required 
              />
              {paymentType === 'Rent/Other' && (
                  <p className="text-xs text-muted-foreground mt-1">
                      Max available: {formatCurrency(record.balanceDue)}
                  </p>
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="paymentDate">
                Date
              </Label>
              <Input 
                id="paymentDate" 
                name="paymentDate" 
                type="date"
                defaultValue={state.data?.paymentDate || new Date().toISOString().split('T')[0]}
                required 
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <SubmitButton>Record Transaction</SubmitButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
