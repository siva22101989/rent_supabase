'use client';

import { useState, useTransition } from 'react';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { finalizePlotDrying } from '@/lib/actions';
import { Loader2, Wheat } from 'lucide-react';

interface FinalizeDryingDialogProps {
  record: {
    id: string;
    plotBags?: number;
    bagsStored: number;
    commodityDescription: string;
  };
}

export function FinalizeDryingDialog({ record }: FinalizeDryingDialogProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const [finalBags, setFinalBags] = useState<number>(record.plotBags || record.bagsStored);

  const rawBags = record.plotBags || record.bagsStored;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (finalBags <= 0) {
        toast({ title: "Error", description: "Bags must be greater than 0", variant: "destructive" });
        return;
    }

    startTransition(async () => {
        const formData = new FormData();
        formData.append('recordId', record.id);
        formData.append('finalBags', finalBags.toString());

        const result = await finalizePlotDrying(null, formData);

        if (result?.success) {
            toast({ title: "Success", description: result.message });
            setOpen(false);
        } else {
            toast({ title: "Error", description: result?.message || "Failed to finalize.", variant: "destructive" });
        }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 text-amber-600 border-amber-200 hover:bg-amber-50">
           <Wheat className="h-4 w-4" />
           Finalize Drying
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Finalize Plot Drying</DialogTitle>
          <DialogDescription>
            Enter the final bag count after drying. This will update the stock and release the unused space.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Product</Label>
                <div className="col-span-3 font-medium">{record.commodityDescription}</div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Raw Bags</Label>
                <div className="col-span-3 font-mono">{rawBags}</div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="finalBags" className="text-right">
                Final Bags
                </Label>
                <Input
                    id="finalBags"
                    type="number"
                    value={finalBags}
                    onChange={(e) => setFinalBags(Number(e.target.value))}
                    className="col-span-3"
                    min="1"
                    required
                />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right text-muted-foreground">Loss</Label>
                <div className="col-span-3 text-destructive font-bold">
                    {rawBags - finalBags} bags
                </div>
            </div>
            </div>
            <DialogFooter>
            <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Confirm & Update Stock
            </Button>
            </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
