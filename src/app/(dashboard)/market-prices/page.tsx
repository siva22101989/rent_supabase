import { PageHeader } from '@/components/shared/page-header';
import { MarketPricesClient } from './market-prices-client';
import { getUserWatchlist, getRecommendation } from '@/lib/commodity-actions';
import { getPriceTrend } from '@/lib/agmarknet-service';
import { getWarehouseDetails } from '@/lib/queries';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';
export const revalidate = 1800; // Revalidate every 30 minutes for market price data

export default async function MarketPricesPage() {
  const warehouse = await getWarehouseDetails();

  if (!warehouse) {
    redirect('/');
  }

  const { data: watchlist } = await getUserWatchlist(warehouse.id);

  // Fetch price data and recommendations for each watchlist item
  const priceDataPromises = (watchlist || []).map(async (item) => {
    const [trend, recommendation] = await Promise.all([
      getPriceTrend(item.commodity, item.preferred_state || undefined, 30),
      getRecommendation(item.commodity, item.preferred_state || undefined),
    ]);

    return {
      commodity: item.commodity,
      market: item.preferred_market || 'Various Markets',
      state: item.preferred_state || 'All India',
      trend,
      recommendation,
    };
  });

  const priceData = await Promise.all(priceDataPromises);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Market Prices"
        description="Track commodity prices and get sell/hold recommendations"
        breadcrumbs={[
          { label: 'Dashboard', href: '/' },
          { label: 'Market Prices' }
        ]}
      />

      <MarketPricesClient
        warehouseId={warehouse.id}
        watchlist={watchlist || []}
        priceData={priceData}
      />
    </div>
  );
}
