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
import { addLotsFromList } from '@/lib/lots-actions';
import { useStaticData } from '@/hooks/use-static-data';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

export function PasteLotListDialog() {
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
            await addLotsFromList(formData);
            toast({ title: "Success", description: "Lots added from list successfully" });
            refresh();
            router.refresh();
            setOpen(false);
        } catch (error: any) {
            toast({ title: "Error", description: error.message || "Failed to add lots", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline">Paste List</Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Paste Lot List</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="list_content">Lot Names</Label>
                        <p className="text-xs text-muted-foreground">Separate by comma or new line (e.g. "A1, A2, B1")</p>
                        <textarea 
                            id="list_content" 
                            name="list_content" 
                            className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            placeholder="A1, A2, A3..." 
                            required 
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="capacity">Capacity per Lot (Bags)</Label>
                        <Input id="capacity" name="capacity" type="number" placeholder="1000" defaultValue="1000" />
                    </div>
                    <Button type="submit" disabled={loading}>
                        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        Add Lots
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    );
}
