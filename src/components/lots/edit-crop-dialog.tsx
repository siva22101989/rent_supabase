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
import { updateCrop } from '@/lib/lots-actions';
import { useRouter } from 'next/navigation';

interface Props {
    crop: {
        id: string;
        name: string;
        rent_price_6m: number;
        rent_price_1y: number;
    };
}

export function EditCropDialog({ crop }: Props) {
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
            await updateCrop(crop.id, formData);
            setOpen(false);
            router.refresh();
        } catch (err: any) {
            setError(err.message || 'Failed to update crop');
        }

        setLoading(false);
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="icon">
                    <Pencil className="h-4 w-4 text-blue-600" />
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>Edit Crop</DialogTitle>
                        <DialogDescription>
                            Update crop name and rental rates.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="name">Crop Name *</Label>
                            <Input
                                id="name"
                                name="name"
                                defaultValue={crop.name}
                                required
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="price6m">Rent (6M) *</Label>
                                <Input
                                    id="price6m"
                                    name="price6m"
                                    type="number"
                                    step="0.01"
                                    defaultValue={crop.rent_price_6m}
                                    required
                                    min="0.01"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="price1y">Rent (1Y) *</Label>
                                <Input
                                    id="price1y"
                                    name="price1y"
                                    type="number"
                                    step="0.01"
                                    defaultValue={crop.rent_price_1y}
                                    required
                                    min="0.01"
                                />
                            </div>
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
