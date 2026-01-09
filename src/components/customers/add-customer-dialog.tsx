
'use client';

import { useEffect, useState, useRef } from 'react';
import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { Loader2, PlusCircle } from 'lucide-react';
import { SubmitButton } from "@/components/ui/submit-button";
import { type FormState } from '@/lib/actions/common';
import { addCustomer } from '@/lib/actions/customers';
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
import { useCustomers } from '@/contexts/customer-context';
import { FormError } from '../shared/form-error';
import { formatPhoneNumber } from '@/lib/validation';

// Local SubmitButton removed in favor of shared component

export function AddCustomerDialog() {
  const { success: toastSuccess, error: toastError } = useUnifiedToast();
  const { refreshCustomers } = useCustomers();
  const [isOpen, setIsOpen] = useState(false);
  const [phone, setPhone] = useState('');
  const lastHandledRef = useRef<any>(null);
  
  const initialState: FormState = { message: '', success: false };
  const [state, formAction] = useActionState(addCustomer, initialState);

  useEffect(() => {
    if (state.message && state !== lastHandledRef.current) {
      lastHandledRef.current = state;
      if (state.success) {
        toastSuccess('Success', state.message);
        refreshCustomers(true);
        setIsOpen(false);
        setPhone(''); // Reset phone on success 
      } else {
        toastError('Error', state.message);
      }
    }
  }, [state, toastSuccess, toastError, refreshCustomers]);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>
          <PlusCircle className="mr-2" />
          Add Customer
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <form action={formAction}>
          <DialogHeader>
            <DialogTitle>Add New Customer</DialogTitle>
            <DialogDescription>
              Enter the details for the new customer. Click save when you&apos;re done.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <FormError message={!state.success ? state.message : undefined} />
            <div className="grid gap-2">
              <Label htmlFor="name">
                Name
              </Label>
              <Input id="name" name="name" defaultValue={state.data?.name} required />
            </div>
             <div className="grid gap-2">
              <Label htmlFor="fatherName">
                Father's Name
              </Label>
              <Input id="fatherName" name="fatherName" defaultValue={state.data?.fatherName} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="village">
                Village
              </Label>
              <Input id="village" name="village" defaultValue={state.data?.village} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="address">
                Address
              </Label>
              <Input id="address" name="address" defaultValue={state.data?.address} required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="phone">
                Phone
              </Label>
              <Input 
                id="phone" 
                name="phone" 
                value={phone || state.data?.phone || ''}
                onChange={(e) => setPhone(formatPhoneNumber(e.target.value))}
                placeholder="+91XXXXXXXXXX or XXXXXXXXXX"
                required 
                pattern="^\+?[0-9]{10,15}$"
                title="Phone number must be 10-15 digits, optional +"
              />
              <p className="text-[10px] text-muted-foreground">
                * 10-15 digits, optional + prefix
              </p>
            </div>
             <div className="grid gap-2">
              <Label htmlFor="email">
                Email
              </Label>
              <Input id="email" name="email" type="email" placeholder="example@gmail.com" defaultValue={state.data?.email} />
              <p className="text-[10px] text-muted-foreground">
                * If this user logs into the Portal with this email, they will automatically see their stock.
              </p>
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <SubmitButton>Save Customer</SubmitButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
