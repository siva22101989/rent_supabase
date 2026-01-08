
'use client';

import { useEffect, useState, useRef } from 'react';
import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { Loader2 } from 'lucide-react';
import { SubmitButton } from "@/components/ui/submit-button";
import { updateStorageRecordAction } from '@/lib/actions/storage/records';
import { type InflowFormState } from '@/lib/actions/storage/inflow';
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
import type { Customer, StorageRecord } from '@/lib/definitions';
import { format } from 'date-fns';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

// Local SubmitButton removed in favor of shared component

export function EditStorageDialog({ record, customers, children }: { record: StorageRecord, customers: Customer[], children: React.ReactNode }) {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const lastHandledRef = useRef<any>(null);
  
  const initialState: InflowFormState = { message: '', success: false };
  const updateAction = updateStorageRecordAction.bind(null, record.id);
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
            <DialogTitle>Edit Storage Record</DialogTitle>
            <DialogDescription>
              Adjust the details for record {record.id}. Payment history cannot be edited here.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="customerId">
                Customer
              </Label>
              <Select name="customerId" defaultValue={state.data?.customerId || record.customerId} required>
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
            <div className="grid gap-2">
              <Label htmlFor="commodityDescription">
                Commodity
              </Label>
                <Input 
                  id="commodityDescription" 
                  name="commodityDescription"
                  defaultValue={state.data?.commodityDescription || record.commodityDescription}
                  required
                />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="location">
                Location
              </Label>
                <Input 
                  id="location" 
                  name="location"
                  defaultValue={state.data?.location || record.location}
                  required
                />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="bagsStored">
                Bags In
              </Label>
                <Input 
                  id="bagsStored" 
                  name="bagsStored" 
                  type="number"
                  defaultValue={state.data?.bagsStored || record.bagsIn} 
                  onFocus={(e) => e.target.select()}
                  onWheel={(e) => e.currentTarget.blur()}
                  required 
                />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="hamaliPayable">
                Hamali Payable
              </Label>
                <Input 
                  id="hamaliPayable"
                  name="hamaliPayable" 
                  type="number"
                  step="0.01"
                  defaultValue={state.data?.hamaliPayable || record.hamaliPayable} 
                  onFocus={(e) => e.target.select()}
                  onWheel={(e) => e.currentTarget.blur()}
                  required 
                />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="storageStartDate">
                Start Date
              </Label>
                <Input 
                  id="storageStartDate" 
                  name="storageStartDate" 
                  type="date"
                  defaultValue={state.data?.storageStartDate || (record.storageStartDate ? format(record.storageStartDate, 'yyyy-MM-dd') : '')}
                  required 
                />
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
