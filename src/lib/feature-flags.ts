import React from 'react';
import { useUnifiedToast } from '@/components/shared/toast-provider';
import { useSubscription } from '@/components/providers/subscription-context';

export type PlanTier = 'free' | 'starter' | 'professional' | 'enterprise';

export interface FeatureGate {
  id: string;
  name: string;
  tier: PlanTier;
}

export interface UsageLimit {
    id: string; // e.g., 'storage_records'
    name: string;
    limit: Record<PlanTier, number>;
}

export const FEATURES: Record<string, FeatureGate> = {
  REPORTS_EXPORT: { id: 'reports_export', name: 'Advanced Reports Export', tier: 'starter' },
  ANALYTICS_DASHBOARD: { id: 'analytics_dashboard', name: 'Analytics Dashboard', tier: 'professional' },
  MULTI_WAREHOUSE: { id: 'multi_warehouse', name: 'Multiple Warehouses', tier: 'professional' },
  WHATSAPP_NOTIFICATIONS: { id: 'whatsapp_notifications', name: 'WhatsApp Notifications', tier: 'starter' },
  API_ACCESS: { id: 'api_access', name: 'API Access', tier: 'enterprise' },
};

export const LIMITS: Record<string, UsageLimit> = {
    STORAGE_RECORDS: {
        id: 'storage_records',
        name: 'Storage Records',
        limit: {
            free: 100,
            starter: 10000, // Unlimited effectively
            professional: 100000,
            enterprise: 1000000
        }
    },
    USERS: {
        id: 'users',
        name: 'Team Members',
        limit: {
            free: 1,
            starter: 3,
            professional: 10,
            enterprise: 50
        }
    }
};

/**
 * Hook to check if a feature is enabled or limit is reached.
 */
export function useFeatureGate() {
  const { warn } = useUnifiedToast();
  const { subscription, loading } = useSubscription();
  const [currentUsage, setCurrentUsage] = React.useState<Record<string, number>>({});

  // Mock usage fetch - replace with real API call
  React.useEffect(() => {
      // simulate usage
      setCurrentUsage({
          storage_records: 45,
          users: 1
      });
  }, []);

  const checkFeature = (featureGate: FeatureGate): boolean => {
    if (loading || !subscription) return false;
    
    // Admin override (optional)
    // if (user.role === 'super_admin') return true;

    const currentPlan = subscription.plan.tier;
    const tierPriority: Record<PlanTier, number> = {
      free: 0,
      starter: 1,
      professional: 2,
      enterprise: 3,
    };

    if (tierPriority[currentPlan] >= tierPriority[featureGate.tier]) {
      return ['active', 'trailing_trial'].includes(subscription.status);
    }

    return false;
  };

  const checkLimit = (limitId: string, additionalAmount = 0): boolean => {
      if (loading || !subscription) return false;
      
      const limitConfig = Object.values(LIMITS).find(l => l.id === limitId);
      if (!limitConfig) return true; // Limit not defined, allow

      const currentPlan = subscription.plan.tier;
      const maxLimit = limitConfig.limit[currentPlan];
      const usage = currentUsage[limitId] || 0;

      return (usage + additionalAmount) <= maxLimit;
  };

  const handleRestrictedAction = (featureGate: FeatureGate) => {
    warn(
      'Upgrade Required',
      `The "${featureGate.name}" feature is available on the ${featureGate.tier} plan and above.`
    );
  };

  const handleLimitReached = (limitConfig: UsageLimit) => {
      warn(
        'Limit Reached',
        `You have reached the ${limitConfig.name} limit for your current plan. Please upgrade to add more.`
      );
  };

  return { checkFeature, checkLimit, handleRestrictedAction, handleLimitReached, isLoading: loading };
}
