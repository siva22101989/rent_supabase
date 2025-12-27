'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { PlanTier } from '@/lib/feature-flags';
import { getSubscriptionAction } from '@/lib/subscription-actions';

interface Subscription {
  plan: {
    tier: PlanTier;
    features: any;
  };
  status: string;
}

interface SubscriptionContextType {
  subscription: Subscription | null;
  loading: boolean;
  refreshSubscription: () => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export function SubscriptionProvider({ 
  children, 
  warehouseId 
}: { 
  children: React.ReactNode;
  warehouseId: string;
}) {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshSubscription = async () => {
    if (!warehouseId) {
        setLoading(false);
        return;
    }
    
    try {
      const data = await getSubscriptionAction(warehouseId);
      if (data) {
        setSubscription({
          plan: data.plans,
          status: data.status,
        });
      } else {
        // Fallback to free if no subscription found
        setSubscription({
          plan: { tier: 'free', features: {} },
          status: 'active'
        });
      }
    } catch (err) {
      console.error('Failed to fetch subscription:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshSubscription();
  }, [warehouseId]);

  return (
    <SubscriptionContext.Provider value={{ subscription, loading, refreshSubscription }}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
}
