'use client';

import { useState, useActionState, useEffect } from 'react';
import { useFormStatus } from 'react-dom';
import { Loader2, Plus, Warehouse } from 'lucide-react';
import { SubmitButton } from "@/components/ui/submit-button";
import { createWarehouse, type ActionState } from '@/lib/warehouse-actions';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

// Local SubmitButton removed in favor of shared component

export function CreateWarehouseDialog() {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const initialState: ActionState = { message: '', success: false };
  const [state, formAction] = useActionState(async (prev: ActionState, formData: FormData) => {
      return createWarehouse(
          formData.get('name') as string,
          formData.get('location') as string,
          Number(formData.get('capacity')),
          formData.get('email') as string,
          formData.get('phone') as string
      );
  }, initialState);

  useEffect(() => {
    if (!state.message) return;
    if (state.success) {
      toast({ title: 'Success', description: state.message });
      setIsOpen(false);
      // Optional: Force reload or update state context
      window.location.reload(); // Hard reload to ensure context switch propagates fully if revalidatePath misses anything
    } else {
      toast({ title: 'Error', description: state.message, variant: 'destructive' });
    }
  }, [state, toast]);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full justify-start">
            <Plus className="mr-2 h-4 w-4" />
            Create New Warehouse
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <form action={formAction}>
          <DialogHeader>
            <DialogTitle>Create New Warehouse</DialogTitle>
            <DialogDescription>
              Add a new facility. You will be the owner.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Warehouse Name</Label>
              <Input id="name" name="name" placeholder="e.g., North Depot" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input id="location" name="location" placeholder="City or District" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="capacity">Capacity (Bags)</Label>
              <Input id="capacity" name="capacity" type="number" placeholder="5000" min="0" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" placeholder="contact@example.com" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" name="phone" type="tel" placeholder="+1234567890" />
            </div>
          </div>
          <DialogFooter>
            <SubmitButton>Create Warehouse</SubmitButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
