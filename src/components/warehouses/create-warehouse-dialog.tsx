'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createWarehouse } from '@/lib/warehouse-actions';
import { useUnifiedToast } from '@/components/shared/toast-provider';
import { useFeatureGate, FEATURES } from '@/lib/feature-flags';

export function CreateWarehouseDialog({ 
    open, 
    onOpenChange 
}: { 
    open: boolean, 
    onOpenChange: (open: boolean) => void 
}) {
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [gstNumber, setGstNumber] = useState('');
  const [capacity, setCapacity] = useState('10000');
  const [loading, setLoading] = useState(false);
  const { success: toastSuccess, error: toastError } = useUnifiedToast();
  const { checkFeature, handleRestrictedAction } = useFeatureGate();

  const handleCreate = async () => {
    // Pro check before submission
    if (!checkFeature(FEATURES.MULTI_WAREHOUSE!)) {
        handleRestrictedAction(FEATURES.MULTI_WAREHOUSE!);
        onOpenChange(false);
        return;
    }

    if (!name || !location || !capacity) {
        toastError('Validation Error', 'Please fill in all fields.');
        return;
    }

    setLoading(true);
    try {
      const result = await createWarehouse(
        name, 
        location, 
        parseInt(capacity),
        undefined, // Email
        undefined,  // Phone
        gstNumber
      );

      if (result.success) {
        toastSuccess('Warehouse Created', `Successfully created ${name}.`);
        onOpenChange(false);
        setName('');
        setLocation('');
        setGstNumber('');
      } else {
        toastError('Creation Failed', result.message);
      }
    } catch (err) {
      toastError('Error', 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Warehouse</DialogTitle>
          <DialogDescription>
            Add a new location to your workspace. This feature is available for <strong>Professional</strong> plans.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Warehouse Name</Label>
            <Input
              id="name"
              placeholder="Main Silo A"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              placeholder="District / State"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="capacity">Capacity (Bags)</Label>
            <Input
              id="capacity"
              type="number"
              value={capacity}
              onChange={(e) => setCapacity(e.target.value)}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="gstNumber">GST Number (Optional)</Label>
            <Input
              id="gstNumber"
              placeholder="37ABCDE1234F1Z5"
              value={gstNumber}
              onChange={(e) => setGstNumber(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleCreate} disabled={loading}>
            {loading ? 'Creating...' : 'Create Warehouse'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
