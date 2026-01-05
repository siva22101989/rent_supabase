'use client';

import { useState, useTransition } from 'react';
import { Button } from "@/components/ui/button";
import { useRouter } from 'next/navigation';
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

import { Separator } from "@/components/ui/separator"; // Add import

interface FinalizeDryingDialogProps {
  record: {
    id: string;
    plotBags?: number;
    bagsStored: number;
    commodityDescription: string;
    hamaliPayable?: number;
  };
}

export function FinalizeDryingDialog({ record }: FinalizeDryingDialogProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const router = useRouter();
  
  const rawBags = record.plotBags || record.bagsStored;
  const initialHamali = record.hamaliPayable || 0;
  const initialRate = rawBags > 0 ? (initialHamali / rawBags) : 0;

  const [finalBags, setFinalBags] = useState<number>(rawBags);
  const [hamaliRate, setHamaliRate] = useState<number>(Number(initialRate.toFixed(2)));
  
  // Calculate total hamali based on current rate and RAW bags (Input quantity)
  const totalHamali = Math.round(rawBags * hamaliRate);

  /* New State */
  const [sendSms, setSendSms] = useState(true);

  // ... (inside handleSubmit)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // ... validation ...

    startTransition(async () => {
        const formData = new FormData();
        formData.append('recordId', record.id);
        formData.append('finalBags', finalBags.toString());
        formData.append('hamaliPayable', totalHamali.toString());
        formData.append('sendSms', sendSms.toString()); // Pass boolean

        const result = await finalizePlotDrying({ message: '', success: false }, formData);

        if (result?.success) {
            toast({ title: "Success", description: result.message });
            setOpen(false);
            router.refresh(); // Ensure the table/list updates immediately
            if (result.recordId) {
                router.push(`/inflow/receipt/${result.recordId}`);
            }
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
            <div className="grid gap-1">
                <Label className="text-muted-foreground text-xs uppercase tracking-wider">Product</Label>
                <div className="font-medium">{record.commodityDescription}</div>
            </div>
            <div className="grid gap-1">
                <Label className="text-muted-foreground text-xs uppercase tracking-wider">Raw Bags</Label>
                <div className="font-mono">{rawBags}</div>
            </div>
            
            <Separator className="my-2" />

            <div className="grid gap-2">
                <Label htmlFor="finalBags">
                Final Bags
                </Label>
                <Input
                    id="finalBags"
                    type="number"
                    value={finalBags}
                    onChange={(e) => setFinalBags(Number(e.target.value))}
                    min="1"
                    onFocus={(e) => e.target.select()}
                    onWheel={(e) => e.currentTarget.blur()}
                    required
                />
            </div>

            {/* Hamali Section */}
            <div className="grid gap-2">
                <Label htmlFor="hamaliRate">
                    Hamali Rate
                </Label>
                <div className="relative">
                    <span className="absolute left-3 top-2.5 text-muted-foreground text-sm">₹</span>
                    <Input
                        id="hamaliRate"
                        type="number"
                        value={hamaliRate}
                        onChange={(e) => setHamaliRate(Number(e.target.value))}
                        className="pl-7"
                        step="0.01"
                        onFocus={(e) => e.target.select()}
                        onWheel={(e) => e.currentTarget.blur()}
                        required
                    />
                </div>
            </div>

            <div className="flex items-center space-x-2 py-4">
                <input
                    type="checkbox"
                    id="sendSms"
                    checked={sendSms}
                    onChange={(e) => setSendSms(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-stone-600 focus:ring-stone-600"
                />
                <Label htmlFor="sendSms" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    Send SMS to Customer
                </Label>
            </div>

                <div className="grid gap-1">
                    <Label className="text-muted-foreground text-xs uppercase tracking-wider text-red-700">Loss</Label>
                    <div className="text-destructive font-bold">
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
