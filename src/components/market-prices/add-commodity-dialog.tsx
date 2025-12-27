'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Search } from 'lucide-react';
import { addToWatchlist, searchCommodities, getMarkets } from '@/lib/commodity-actions';

interface AddCommodityDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  warehouseId: string;
}

export function AddCommodityDialog({ open, onOpenChange, warehouseId }: AddCommodityDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [commodities, setCommodities] = useState<string[]>([]);
  const [markets, setMarkets] = useState<Array<{ market: string; state: string; district: string | null }>>([]);
  const [loadingMarkets, setLoadingMarkets] = useState(false);
  
  const [formData, setFormData] = useState({
    commodity: '',
    market: '',
    state: '',
    alertThreshold: '',
  });

  // Search commodities as user types
  useEffect(() => {
    if (searchQuery.length < 2) {
      setCommodities([]);
      return;
    }

    const timer = setTimeout(async () => {
      const result = await searchCommodities(searchQuery);
      if (result.success) {
        setCommodities(result.data);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch markets when commodity is selected
  useEffect(() => {
    if (!formData.commodity) {
      setMarkets([]);
      return;
    }

    const fetchMarkets = async () => {
      setLoadingMarkets(true);
      const result = await getMarkets(formData.commodity, formData.state || undefined);
      if (result.success) {
        setMarkets(result.data);
      }
      setLoadingMarkets(false);
    };

    fetchMarkets();
  }, [formData.commodity, formData.state]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.commodity) {
      toast({
        title: 'Error',
        description: 'Please select a commodity',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    const result = await addToWatchlist(
      warehouseId,
      formData.commodity,
      undefined, // variety
      formData.market || undefined,
      formData.state || undefined,
      formData.alertThreshold ? parseFloat(formData.alertThreshold) : undefined
    );

    setLoading(false);

    if (result.success) {
      toast({
        title: 'Success',
        description: `${formData.commodity} added to watchlist`,
      });
      onOpenChange(false);
      // Reset form
      setFormData({
        commodity: '',
        market: '',
        state: '',
        alertThreshold: '',
      });
      setSearchQuery('');
    } else {
      toast({
        title: 'Error',
        description: result.message,
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add Commodity to Watchlist</DialogTitle>
          <DialogDescription>
            Track commodity prices and get alerts when prices reach your target
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Commodity Search */}
          <div className="space-y-2">
            <Label htmlFor="commodity">Commodity *</Label>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="commodity"
                placeholder="Search commodity (e.g., Wheat, Rice)"
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoComplete="off"
              />
            </div>
            
            {/* Commodity Suggestions */}
            {commodities.length > 0 && (
              <div className="border rounded-md max-h-40 overflow-y-auto">
                {commodities.map((commodity) => (
                  <button
                    key={commodity}
                    type="button"
                    className="w-full text-left px-3 py-2 hover:bg-muted transition-colors text-sm"
                    onClick={() => {
                      setFormData({ ...formData, commodity });
                      setSearchQuery(commodity);
                      setCommodities([]);
                    }}
                  >
                    {commodity}
                  </button>
                ))}
              </div>
            )}

            {formData.commodity && (
              <p className="text-sm text-muted-foreground">
                Selected: <span className="font-medium">{formData.commodity}</span>
              </p>
            )}
          </div>

          {/* State Selection */}
          <div className="space-y-2">
            <Label htmlFor="state">State (Optional)</Label>
            <Select
              value={formData.state}
              onValueChange={(value) => setFormData({ ...formData, state: value, market: '' })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select state" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Punjab">Punjab</SelectItem>
                <SelectItem value="Haryana">Haryana</SelectItem>
                <SelectItem value="Uttar Pradesh">Uttar Pradesh</SelectItem>
                <SelectItem value="Madhya Pradesh">Madhya Pradesh</SelectItem>
                <SelectItem value="Rajasthan">Rajasthan</SelectItem>
                <SelectItem value="Maharashtra">Maharashtra</SelectItem>
                <SelectItem value="Karnataka">Karnataka</SelectItem>
                <SelectItem value="Andhra Pradesh">Andhra Pradesh</SelectItem>
                <SelectItem value="Tamil Nadu">Tamil Nadu</SelectItem>
                <SelectItem value="West Bengal">West Bengal</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Market Selection */}
          <div className="space-y-2">
            <Label htmlFor="market">Market (Optional)</Label>
            {loadingMarkets ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading markets...
              </div>
            ) : markets.length > 0 ? (
              <Select
                value={formData.market}
                onValueChange={(value) => setFormData({ ...formData, market: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select market" />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {markets.map((m, index) => (
                    <SelectItem key={index} value={m.market}>
                      {m.market}, {m.state}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <p className="text-sm text-muted-foreground">
                {formData.commodity ? 'No markets found' : 'Select a commodity first'}
              </p>
            )}
          </div>

          {/* Alert Threshold */}
          <div className="space-y-2">
            <Label htmlFor="threshold">Price Alert (₹/quintal) (Optional)</Label>
            <Input
              id="threshold"
              type="number"
              placeholder="e.g., 2500"
              value={formData.alertThreshold}
              onChange={(e) => setFormData({ ...formData, alertThreshold: e.target.value })}
            />
            <p className="text-xs text-muted-foreground">
              You'll be notified when price reaches or exceeds this amount
            </p>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !formData.commodity}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Add to Watchlist
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
