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
import { bulkAddLots } from '@/lib/lots-actions';
import { useStaticData } from '@/hooks/use-static-data';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

export function BulkAddLotsDialog() {
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
            await bulkAddLots(formData);
            toast({ title: "Success", description: "Lots generated successfully" });
            refresh();
            router.refresh();
            setOpen(false);
        } catch (error: any) {
            toast({ title: "Error", description: error.message || "Failed to generate lots", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="secondary">Bulk Add Lots</Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Bulk Add Lots</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="prefix">Prefix</Label>
                        <Input id="prefix" name="prefix" placeholder="e.g. Row A-" required />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="start">Start Number</Label>
                            <Input id="start" name="start" type="number" placeholder="1" required />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="end">End Number</Label>
                            <Input id="end" name="end" type="number" placeholder="50" required />
                        </div>
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="capacity">Capacity per Lot (Bags)</Label>
                        <Input id="capacity" name="capacity" type="number" placeholder="1000" defaultValue="1000" />
                    </div>
                    <Button type="submit" disabled={loading}>
                        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        Generate Lots
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    );
}
