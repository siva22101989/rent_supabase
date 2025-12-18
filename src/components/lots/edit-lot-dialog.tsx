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
import { updateLot } from '@/lib/lots-actions';
import { useRouter } from 'next/navigation';

interface Props {
    lot: {
        id: string;
        name: string;
        capacity: number;
    };
}

export function EditLotDialog({ lot }: Props) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const router = useRouter();

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const formData = new FormData(e.currentTarget);
            await updateLot(lot.id, formData);
            setOpen(false);
            router.refresh();
        } catch (err: any) {
            setError(err.message || 'Failed to update lot');
        }

        setLoading(false);
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="icon">
                    <Pencil className="h-4 w-4" />
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>Edit Lot</DialogTitle>
                        <DialogDescription>
                            Update lot name and capacity.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="name">Lot Name *</Label>
                            <Input
                                id="name"
                                name="name"
                                defaultValue={lot.name}
                                required
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="capacity">Capacity (bags) *</Label>
                            <Input
                                id="capacity"
                                name="capacity"
                                type="number"
                                defaultValue={lot.capacity}
                                required
                                min="1"
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
