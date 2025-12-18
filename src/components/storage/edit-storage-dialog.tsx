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
import { Pencil } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface StorageRecord {
    id: string;
    commodityDescription: string;
    location: string;
    bagsStored: number;
    storageStartDate: string | Date;
    hamaliPayable: number;
    storageEndDate?: string | Date | null;
}

interface Props {
    record: StorageRecord;
    variant?: 'default' | 'outline' | 'ghost';
    size?: 'default' | 'sm' | 'lg' | 'icon';
}

export function EditStorageDialog({ record, variant = 'outline', size = 'sm' }: Props) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const router = useRouter();

    // Can't edit if already completed (has end date)
    const isCompleted = !!record.storageEndDate;

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setLoading(true);
        setError('');

        const formData = new FormData(e.currentTarget);
        
        try {
            const response = await fetch('/api/storage/update', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: record.id,
                    commodityDescription: formData.get('commodityDescription'),
                    location: formData.get('location'),
                    bagsStored: parseInt(formData.get('bagsStored') as string),
                    hamaliPayable: parseFloat(formData.get('hamaliPayable') as string),
                    storageStartDate: formData.get('storageStartDate'),
                })
            });

            const result = await response.json();

            if (result.success) {
                setOpen(false);
                router.refresh();
            } else {
                setError(result.message || 'Failed to update record');
            }
        } catch (err) {
            setError('An error occurred while updating');
        }

        setLoading(false);
    }

    if (isCompleted) {
        return (
            <Button variant={variant} size={size} disabled title="Cannot edit completed records">
                <Pencil className="h-4 w-4 mr-2" />
                Edit
            </Button>
        );
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant={variant} size={size}>
                    <Pencil className="h-4 w-4 mr-2" />
                    Edit
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>Edit Storage Record</DialogTitle>
                        <DialogDescription>
                            Update storage record details. Cannot edit completed records.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="commodityDescription">Commodity Description *</Label>
                            <Input
                                id="commodityDescription"
                                name="commodityDescription"
                                defaultValue={record.commodityDescription}
                                required
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="location">Location *</Label>
                            <Input
                                id="location"
                                name="location"
                                defaultValue={record.location}
                                required
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="bagsStored">Number of Bags *</Label>
                            <Input
                                id="bagsStored"
                                name="bagsStored"
                                type="number"
                                defaultValue={record.bagsStored}
                                required
                                min="1"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="hamaliPayable">Hamali Payable</Label>
                            <Input
                                id="hamaliPayable"
                                name="hamaliPayable"
                                type="number"
                                step="0.01"
                                defaultValue={record.hamaliPayable}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="storageStartDate">Storage Start Date *</Label>
                            <Input
                                id="storageStartDate"
                                name="storageStartDate"
                                type="date"
                                defaultValue={
                                    typeof record.storageStartDate === 'string'
                                        ? record.storageStartDate.split('T')[0]
                                        : new Date(record.storageStartDate).toISOString().split('T')[0]
                                }
                                required
                            />
                        </div>
                    </div>
                    {error && (
                        <p className="text-sm text-destructive mb-4">{error}</p>
                    )}
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? 'Saving...' : 'Save Changes'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
