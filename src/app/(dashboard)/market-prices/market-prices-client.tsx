'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Trash2, Bell, BellOff } from 'lucide-react';
import { AddCommodityDialog } from '@/components/market-prices/add-commodity-dialog';
import { PriceChart } from '@/components/market-prices/price-chart';
import { RecommendationCard } from '@/components/market-prices/recommendation-card';
import { Badge } from '@/components/ui/badge';
import { removeFromWatchlist, updateWatchlistItem } from '@/lib/commodity-actions';
import { useToast } from '@/hooks/use-toast';

interface WatchlistItem {
  id: string;
  commodity: string;
  variety: string | null;
  preferred_market: string | null;
  preferred_state: string | null;
  alert_threshold: number | null;
  alert_enabled: boolean;
}

interface PriceTrend {
  current: number | null;
  average: number | null;
  min: number | null;
  max: number | null;
  trend: 'rising' | 'falling' | 'stable';
  change_percent: number | null;
  history: Array<{ date: string; price: number }>;
}

interface Recommendation {
  action: 'SELL_NOW' | 'SELL_SOON' | 'HOLD' | 'MONITOR';
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  reason: string;
  details: PriceTrend | null;
}

interface MarketPricesClientProps {
  warehouseId: string;
  watchlist: WatchlistItem[];
  priceData: Array<{
    commodity: string;
    market: string;
    state: string;
    trend: PriceTrend;
    recommendation: Recommendation;
  }>;
}

export function MarketPricesClient({ warehouseId, watchlist, priceData }: MarketPricesClientProps) {
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (id: string, commodity: string) => {
    if (!confirm(`Remove ${commodity} from watchlist?`)) return;

    setDeletingId(id);
    const result = await removeFromWatchlist(id);
    setDeletingId(null);

    if (result.success) {
      toast({
        title: 'Success',
        description: `${commodity} removed from watchlist`,
      });
      window.location.reload(); // Refresh data
    } else {
      toast({
        title: 'Error',
        description: result.message,
        variant: 'destructive',
      });
    }
  };

  const handleToggleAlert = async (item: WatchlistItem) => {
    const result = await updateWatchlistItem(item.id, {
      alertEnabled: !item.alert_enabled,
    });

    if (result.success) {
      toast({
        title: 'Success',
        description: `Alerts ${!item.alert_enabled ? 'enabled' : 'disabled'} for ${item.commodity}`,
      });
      window.location.reload();
    } else {
      toast({
        title: 'Error',
        description: result.message,
        variant: 'destructive',
      });
    }
  };

  if (watchlist.length === 0) {
    return (
      <>
        <Card>
          <CardContent className="py-12">
            <div className="text-center space-y-4">
              <div className="text-6xl">📊</div>
              <div>
                <h3 className="text-lg font-semibold mb-2">No Commodities Tracked</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Start tracking commodity prices to make better sell/hold decisions
                </p>
                <Button onClick={() => setDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Commodity
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <AddCommodityDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          warehouseId={warehouseId}
        />
      </>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {/* Watchlist Summary */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>My Watchlist</CardTitle>
              <Button onClick={() => setDialogOpen(true)} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Commodity
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3">
              {watchlist.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 rounded-lg border bg-muted/30"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{item.commodity}</p>
                      {item.alert_threshold && (
                        <Badge variant="secondary" className="text-xs">
                          Alert: ₹{item.alert_threshold.toLocaleString()}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {item.preferred_market || 'All Markets'}, {item.preferred_state || 'All India'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleToggleAlert(item)}
                    >
                      {item.alert_enabled ? (
                        <Bell className="h-4 w-4" />
                      ) : (
                        <BellOff className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(item.id, item.commodity)}
                      disabled={deletingId === item.id}
                    >
                      <Trash2 className="h-4 w-4 text-rose-600" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Price Charts and Recommendations */}
        {priceData.map((data, index) => (
          <div key={index} className="space-y-4">
            {/* Recommendation */}
            <RecommendationCard
              action={data.recommendation.action}
              confidence={data.recommendation.confidence}
              reason={data.recommendation.reason}
              details={data.recommendation.details}
            />

            {/* Price Chart */}
            <PriceChart
              commodity={data.commodity}
              market={data.market}
              state={data.state}
              trend={data.trend}
            />
          </div>
        ))}
      </div>

      <AddCommodityDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        warehouseId={warehouseId}
      />
    </>
  );
}
