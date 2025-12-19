'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { addLot } from '@/lib/lots-actions';
import { useStaticData } from '@/hooks/use-static-data';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

export function AddLotDialog() {
    const { refresh } = useStaticData();
    const { toast } = useToast();
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setLoading(true);
        const formData = new FormData(e.currentTarget);
        
        try {
            await addLot(formData);
            toast({ title: "Success", description: "Lot added successfully" });
            refresh();
            router.refresh();
            setOpen(false);
            e.currentTarget.reset();
        } catch (error: any) {
            toast({ title: "Error", description: error.message || "Failed to add lot", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>Add Single Lot</Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Add New Lot</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="name">Lot Name</Label>
                        <Input id="name" name="name" placeholder="e.g. A-1" required />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="capacity">Capacity (Bags)</Label>
                        <Input id="capacity" name="capacity" type="number" placeholder="1000" defaultValue="1000" />
                    </div>
                    <Button type="submit" disabled={loading}>
                        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        Create Lot
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    );
}
