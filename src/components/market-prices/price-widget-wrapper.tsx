import { MarketPricesWidget } from '@/components/market-prices/price-widget';
import { getUserWatchlist, getCommodityPricesWithTrend } from '@/lib/commodity-actions';
import { getPriceTrend } from '@/lib/agmarknet-service';

interface MarketPricesWidgetWrapperProps {
  warehouseId: string | undefined;
}

export async function MarketPricesWidgetWrapper({ warehouseId }: MarketPricesWidgetWrapperProps) {
  if (!warehouseId) {
    return null;
  }

  // Fetch user's watchlist
  const { data: watchlist } = await getUserWatchlist(warehouseId);

  if (!watchlist || watchlist.length === 0) {
    return <MarketPricesWidget watchlist={[]} priceData={[]} />;
  }

  // Fetch price data for each watchlist item
  const priceDataPromises = watchlist.map(async (item) => {
    const trend = await getPriceTrend(
      item.commodity,
      item.preferred_state || undefined,
      7 // Last 7 days for trend
    );

    return {
      commodity: item.commodity,
      modal_price: trend.current,
      price_date: new Date().toISOString().split('T')[0],
      market: item.preferred_market || 'Various Markets',
      state: item.preferred_state || 'All India',
      change_percent: trend.change_percent,
      trend: trend.trend,
    };
  });

  const priceData = await Promise.all(priceDataPromises);

  return <MarketPricesWidget watchlist={watchlist} priceData={priceData} />;
}
