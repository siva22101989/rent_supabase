import React from 'react';
import { useUnifiedToast } from '@/components/shared/toast-provider';
import { useSubscription } from '@/components/providers/subscription-context';

export type PlanTier = 'free' | 'starter' | 'professional' | 'enterprise';

export interface FeatureGate {
  id: string;
  name: string;
  tier: PlanTier;
}

export const FEATURES: Record<string, FeatureGate> = {
  REPORTS_EXPORT: { id: 'reports_export', name: 'Advanced Reports Export', tier: 'starter' },
  ANALYTICS_DASHBOARD: { id: 'analytics_dashboard', name: 'Analytics Dashboard', tier: 'professional' },
  MULTI_WAREHOUSE: { id: 'multi_warehouse', name: 'Multiple Warehouses', tier: 'professional' },
  WHATSAPP_NOTIFICATIONS: { id: 'whatsapp_notifications', name: 'WhatsApp Notifications', tier: 'starter' },
  API_ACCESS: { id: 'api_access', name: 'API Access', tier: 'enterprise' },
};

/**
 * Hook to check if a feature is enabled for the current warehouse/user.
 */
export function useFeatureGate() {
  const { warn } = useUnifiedToast();
  const { subscription, loading } = useSubscription();

  const checkFeature = (featureGate: FeatureGate): boolean => {
    if (loading || !subscription) return false;
    
    const currentPlan = subscription.plan.tier;
    const tierPriority: Record<PlanTier, number> = {
      free: 0,
      starter: 1,
      professional: 2,
      enterprise: 3,
    };

    if (tierPriority[currentPlan] >= tierPriority[featureGate.tier]) {
      // If the subscription is active or in trial, it's enabled
      return ['active', 'trailing_trial'].includes(subscription.status);
    }

    return false;
  };

  const handleRestrictedAction = (featureGate: FeatureGate) => {
    warn(
      'Upgrade Required',
      `The "${featureGate.name}" feature is available on the ${featureGate.tier} plan and above.`
    );
  };

  return { checkFeature, handleRestrictedAction, isLoading: loading };
}
