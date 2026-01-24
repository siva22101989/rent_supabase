'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { movePlotToStorage } from '@/lib/unloading-actions';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Sprout, ArrowRight } from 'lucide-react';

interface PlotInventoryProps {
    plotData: Array<{
        plotLocation: string;
        totalBags: number;
        records: Array<{
            id: string;
            bags_remaining_in_plot: number;
            unload_date: string;
            customer: { name: string };
            commodity_description: string;
            crop_id: string;
            customer_id: string;
        }>;
    }>;
    lots: Array<{ id: string; name: string; capacity: number; current_stock: number }>;
}

export function PlotInventory({ plotData, lots }: PlotInventoryProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [selectedPlot, setSelectedPlot] = useState<string | null>(null);
    const { toast } = useToast();

    const currentPlot = plotData.find(p => p.plotLocation === selectedPlot);

    async function handleMoveToStorage(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        if (!currentPlot) return;

        setIsLoading(true);
        const formData = new FormData(e.currentTarget);

        const bagsToMove = parseInt(formData.get('bagsToMove') as string);
        const lotId = formData.get('lotId') as string;

        // Use first record's details for the storage record
        const firstRecord = currentPlot.records[0];
        if (!firstRecord) return;

        const result = await movePlotToStorage({
            plotLocation: selectedPlot!,
            bagsToMove,
            lotId,
            customerId: firstRecord.customer_id,
            commodityDescription: firstRecord.commodity_description,
            cropId: firstRecord.crop_id,
        });

        if (result.success) {
            toast({
                title: 'Success',
                description: `Moved ${bagsToMove} bags from ${selectedPlot} to storage`,
            });
            setSelectedPlot(null);
            window.location.reload(); // Refresh to show updated data
        } else {
            toast({
                title: 'Error',
                description: result.error,
                variant: 'destructive',
            });
        }

        setIsLoading(false);
    }

    if (plotData.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Sprout className="h-5 w-5" />
                        Plot Inventory
                    </CardTitle>
                    <CardDescription>No bags currently in plot for drying</CardDescription>
                </CardHeader>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Sprout className="h-5 w-5" />
                    Plot Inventory
                </CardTitle>
                <CardDescription>Bags currently drying in plot locations</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-3">
                    {plotData.map((plot) => (
                        <div
                            key={plot.plotLocation}
                            className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                        >
                            <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                    <h4 className="font-semibold">{plot.plotLocation}</h4>
                                    <Badge variant="secondary">{plot.totalBags} bags</Badge>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                    {plot.records.length} unloading batch{plot.records.length > 1 ? 'es' : ''}
                                </p>
                            </div>

                            <Dialog>
                                <DialogTrigger asChild>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setSelectedPlot(plot.plotLocation)}
                                    >
                                        Move to Storage
                                        <ArrowRight className="ml-2 h-4 w-4" />
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <form onSubmit={handleMoveToStorage}>
                                        <DialogHeader>
                                            <DialogTitle>Move from {plot.plotLocation} to Storage</DialogTitle>
                                            <DialogDescription>
                                                Available: {plot.totalBags} bags
                                            </DialogDescription>
                                        </DialogHeader>

                                        <div className="space-y-4 py-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="bagsToMove">Bags to Move *</Label>
                                                <Input
                                                    type="number"
                                                    name="bagsToMove"
                                                    min="1"
                                                    max={plot.totalBags}
                                                    required
                                                    placeholder={`Max: ${plot.totalBags}`}
                                                />
                                                <p className="text-xs text-muted-foreground">
                                                    Loss will be calculated automatically
                                                </p>
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor="lotId">Destination Lot *</Label>
                                                <Select name="lotId" required>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select lot" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {lots.map((lot) => {
                                                            const available = lot.capacity - lot.current_stock;
                                                            return (
                                                                <SelectItem key={lot.id} value={lot.id}>
                                                                    {lot.name} - {available} bags available ({lot.current_stock}/{lot.capacity})
                                                                </SelectItem>
                                                            );
                                                        })}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>

                                        <DialogFooter>
                                            <Button type="submit" disabled={isLoading}>
                                                {isLoading ? (
                                                    <>
                                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                        Moving...
                                                    </>
                                                ) : (
                                                    'Move to Storage'
                                                )}
                                            </Button>
                                        </DialogFooter>
                                    </form>
                                </DialogContent>
                            </Dialog>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
