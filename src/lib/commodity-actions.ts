/**
 * Commodity Price Actions
 * 
 * Server actions for managing commodity price watchlists and fetching price data
 */

'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/utils/supabase/server';
import {
  getCachedPrices,
  getPriceTrend,
  getAvailableCommodities,
  getMarketsForCommodity,
  type CommodityPrice,
} from '@/lib/agmarknet-service';

/**
 * Add commodity to user's watchlist
 */
export async function addToWatchlist(
  warehouseId: string,
  commodity: string,
  variety?: string,
  preferredMarket?: string,
  preferredState?: string,
  alertThreshold?: number
) {
  const supabase = await createClient();
  
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, message: 'Not authenticated' };
    }

    const { error } = await supabase
      .from('user_commodity_watchlist')
      .insert({
        user_id: user.id,
        warehouse_id: warehouseId,
        commodity,
        variety: variety || null,
        preferred_market: preferredMarket || null,
        preferred_state: preferredState || null,
        alert_threshold: alertThreshold || null,
        alert_enabled: true,
      });

    if (error) {
      console.error('[WATCHLIST] Add error:', error);
      return { success: false, message: error.message };
    }

    revalidatePath('/');
    revalidatePath('/market-prices');
    
    return { success: true, message: 'Added to watchlist' };
  } catch (error: any) {
    console.error('[WATCHLIST] Add error:', error);
    return { success: false, message: error.message || 'Failed to add to watchlist' };
  }
}

/**
 * Remove commodity from user's watchlist
 */
export async function removeFromWatchlist(watchlistId: string) {
  const supabase = await createClient();
  
  try {
    const { error } = await supabase
      .from('user_commodity_watchlist')
      .delete()
      .eq('id', watchlistId);

    if (error) {
      console.error('[WATCHLIST] Remove error:', error);
      return { success: false, message: error.message };
    }

    revalidatePath('/');
    revalidatePath('/market-prices');
    
    return { success: true, message: 'Removed from watchlist' };
  } catch (error: any) {
    console.error('[WATCHLIST] Remove error:', error);
    return { success: false, message: error.message || 'Failed to remove from watchlist' };
  }
}

/**
 * Update watchlist item (alert threshold, preferred market, etc.)
 */
export async function updateWatchlistItem(
  watchlistId: string,
  updates: {
    preferredMarket?: string;
    preferredState?: string;
    alertThreshold?: number;
    alertEnabled?: boolean;
  }
) {
  const supabase = await createClient();
  
  try {
    const { error } = await supabase
      .from('user_commodity_watchlist')
      .update({
        preferred_market: updates.preferredMarket,
        preferred_state: updates.preferredState,
        alert_threshold: updates.alertThreshold,
        alert_enabled: updates.alertEnabled,
      })
      .eq('id', watchlistId);

    if (error) {
      console.error('[WATCHLIST] Update error:', error);
      return { success: false, message: error.message };
    }

    revalidatePath('/');
    revalidatePath('/market-prices');
    
    return { success: true, message: 'Watchlist updated' };
  } catch (error: any) {
    console.error('[WATCHLIST] Update error:', error);
    return { success: false, message: error.message || 'Failed to update watchlist' };
  }
}

/**
 * Get user's watchlist for a specific warehouse
 */
export async function getUserWatchlist(warehouseId: string) {
  const supabase = await createClient();
  
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, data: [], message: 'Not authenticated' };
    }

    const { data, error } = await supabase
      .from('user_commodity_watchlist')
      .select('*')
      .eq('user_id', user.id)
      .eq('warehouse_id', warehouseId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[WATCHLIST] Fetch error:', error);
      return { success: false, data: [], message: error.message };
    }

    return { success: true, data: data || [], message: 'Watchlist fetched' };
  } catch (error: any) {
    console.error('[WATCHLIST] Fetch error:', error);
    return { success: false, data: [], message: error.message || 'Failed to fetch watchlist' };
  }
}

/**
 * Get commodity prices with trend analysis
 */
export async function getCommodityPricesWithTrend(
  commodity: string,
  state?: string
) {
  try {
    const [prices, trend] = await Promise.all([
      getCachedPrices(commodity, state),
      getPriceTrend(commodity, state, 30),
    ]);

    return {
      success: true,
      data: {
        prices,
        trend,
      },
      message: 'Prices fetched successfully',
    };
  } catch (error: any) {
    console.error('[COMMODITY] Fetch error:', error);
    return {
      success: false,
      data: { prices: [], trend: null },
      message: error.message || 'Failed to fetch prices',
    };
  }
}

/**
 * Get sell/hold recommendation based on price trend
 */
export async function getRecommendation(commodity: string, state?: string) {
  try {
    const trend = await getPriceTrend(commodity, state, 30);

    if (!trend.current || !trend.average) {
      return {
        action: 'MONITOR' as const,
        confidence: 'LOW' as const,
        reason: 'Insufficient price data for recommendation',
        details: trend,
      };
    }

    const priceVsAvg = ((trend.current - trend.average) / trend.average) * 100;

    // Sell recommendation logic
    if (priceVsAvg > 10 && trend.trend === 'falling') {
      return {
        action: 'SELL_NOW' as const,
        confidence: 'HIGH' as const,
        reason: `Price is ${priceVsAvg.toFixed(1)}% above average and trending down. Consider selling within 3-5 days.`,
        details: trend,
      };
    }

    if (priceVsAvg > 5 && trend.trend === 'stable') {
      return {
        action: 'SELL_SOON' as const,
        confidence: 'MEDIUM' as const,
        reason: `Price is ${priceVsAvg.toFixed(1)}% above average. Good time to sell if you need liquidity.`,
        details: trend,
      };
    }

    // Hold recommendation logic
    if (trend.trend === 'rising' && priceVsAvg < 5) {
      return {
        action: 'HOLD' as const,
        confidence: 'MEDIUM' as const,
        reason: `Price is rising but still ${Math.abs(priceVsAvg).toFixed(1)}% below average. Wait for better prices.`,
        details: trend,
      };
    }

    if (priceVsAvg < -5) {
      return {
        action: 'HOLD' as const,
        confidence: 'HIGH' as const,
        reason: `Price is ${Math.abs(priceVsAvg).toFixed(1)}% below average. Not a good time to sell.`,
        details: trend,
      };
    }

    // Default: Monitor
    return {
      action: 'MONITOR' as const,
      confidence: 'LOW' as const,
      reason: 'Price is near average with no clear trend. Monitor daily for changes.',
      details: trend,
    };

  } catch (error: any) {
    console.error('[RECOMMENDATION] Error:', error);
    return {
      action: 'MONITOR' as const,
      confidence: 'LOW' as const,
      reason: 'Unable to generate recommendation',
      details: null,
    };
  }
}

/**
 * Search commodities (for autocomplete)
 */
export async function searchCommodities(query: string) {
  try {
    // Use predefined list of common agricultural commodities
    const allCommodities = [
      'Wheat', 'Rice', 'Paddy', 'Maize', 'Bajra', 'Jowar',
      'Gram', 'Tur', 'Moong', 'Urad', 'Masoor', 'Arhar',
      'Groundnut', 'Soybean', 'Sunflower', 'Mustard',
      'Cotton', 'Sugarcane', 'Potato', 'Onion', 'Tomato',
      'Chilli', 'Turmeric', 'Coriander', 'Cumin', 'Ginger',
      'Garlic', 'Apple', 'Banana', 'Mango', 'Orange',
    ];
    
    const filtered = allCommodities.filter(commodity =>
      commodity.toLowerCase().includes(query.toLowerCase())
    );

    return {
      success: true,
      data: filtered.slice(0, 20), // Limit to 20 results
      message: 'Commodities found',
    };
  } catch (error: any) {
    console.error('[SEARCH] Error:', error);
    return {
      success: false,
      data: [],
      message: error.message || 'Search failed',
    };
  }
}

/**
 * Get markets for a commodity (for market selection)
 */
export async function getMarkets(commodity: string, state?: string) {
  try {
    // Return sample markets based on state
    const sampleMarkets: Record<string, Array<{ market: string; state: string; district: string | null }>> = {
      'Punjab': [
        { market: 'Ludhiana', state: 'Punjab', district: 'Ludhiana' },
        { market: 'Amritsar', state: 'Punjab', district: 'Amritsar' },
        { market: 'Jalandhar', state: 'Punjab', district: 'Jalandhar' },
        { market: 'Patiala', state: 'Punjab', district: 'Patiala' },
      ],
      'Haryana': [
        { market: 'Karnal', state: 'Haryana', district: 'Karnal' },
        { market: 'Ambala', state: 'Haryana', district: 'Ambala' },
        { market: 'Hisar', state: 'Haryana', district: 'Hisar' },
      ],
      'Uttar Pradesh': [
        { market: 'Meerut', state: 'Uttar Pradesh', district: 'Meerut' },
        { market: 'Agra', state: 'Uttar Pradesh', district: 'Agra' },
        { market: 'Lucknow', state: 'Uttar Pradesh', district: 'Lucknow' },
      ],
      'Madhya Pradesh': [
        { market: 'Indore', state: 'Madhya Pradesh', district: 'Indore' },
        { market: 'Bhopal', state: 'Madhya Pradesh', district: 'Bhopal' },
      ],
    };

    const markets = state && sampleMarkets[state] 
      ? sampleMarkets[state]
      : Object.values(sampleMarkets).flat().slice(0, 10);

    return {
      success: true,
      data: markets,
      message: 'Markets found',
    };
  } catch (error: any) {
    console.error('[MARKETS] Error:', error);
    return {
      success: false,
      data: [],
      message: error.message || 'Failed to fetch markets',
    };
  }
}
