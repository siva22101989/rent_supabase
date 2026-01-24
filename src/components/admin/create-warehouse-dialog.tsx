'use client';

import { useState } from 'react';
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
import { useUnifiedToast } from '@/components/shared/toast-provider';
import { Loader2, Database } from 'lucide-react';
import { createWarehouse } from '@/lib/warehouse-actions';
import { useRouter } from 'next/navigation';

export function CreateWarehouseDialog() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { success, error } = useUnifiedToast();
  const router = useRouter();

  // Form State
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [capacity, setCapacity] = useState('5000');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  const handleCreate = async () => {
      if (!name || !location) {
          error("Validation Error", "Name and Location are required");
          return;
      }

      setLoading(true);
      try {
            const res = await createWarehouse(
                name,
                location,
                parseInt(capacity) || 5000,
                email || undefined,
                phone || undefined
            );

            if (res.success) {
                success("Success", "Warehouse created successfully.");
                setOpen(false);
                resetForm();
                router.refresh();
            } else {
                error("Error", res.message);
            }
      } catch (err: any) {
          error("Error", err.message);
      } finally {
          setLoading(false);
      }
  };

  const resetForm = () => {
      setName('');
      setLocation('');
      setCapacity('5000');
      setEmail('');
      setPhone('');
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-indigo-600 hover:bg-indigo-700 shadow-sm gap-2">
          <Database className="h-4 w-4" />
          <span className="hidden xs:inline">Create Warehouse</span>
          <span className="xs:hidden">Create</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Warehouse</DialogTitle>
          <DialogDescription>Add a new storage facility to the platform.</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
            <div className="grid gap-2">
                <Label htmlFor="name">Warehouse Name *</Label>
                <Input 
                    id="name"
                    placeholder="e.g. Central Silo A"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                />
            </div>
            
            <div className="grid gap-2">
                <Label htmlFor="location">Location *</Label>
                <Input 
                    id="location"
                    placeholder="e.g. Nagpur, MH"
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

            <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                    <Label htmlFor="email">Owner Email (Optional)</Label>
                    <Input 
                        id="email"
                        type="email"
                        placeholder="owner@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="phone">Phone (Optional)</Label>
                    <Input 
                        id="phone"
                        type="tel"
                        placeholder="+91..."
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                    />
                </div>
            </div>
        </div>

        <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
                Cancel
            </Button>
            <Button onClick={handleCreate} disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Warehouse
            </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
