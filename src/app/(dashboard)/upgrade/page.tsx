'use client';

import { useState } from 'react';
import { PageHeader } from '@/components/shared/page-header';
import { PricingTable } from '@/components/subscription/pricing-table';
import { useUnifiedToast } from '@/components/shared/toast-provider';
import { startSubscriptionAction } from '@/lib/subscription-actions';
import { PlanTier } from '@/lib/feature-flags';
import { useRouter } from 'next/navigation';
import { useWarehouses } from '@/contexts/warehouse-context';

export default function UpgradePage() {
  const [loading, setLoading] = useState(false);
  const { success: toastSuccess, error: toastError } = useUnifiedToast();
  const router = useRouter();

  const { currentWarehouse } = useWarehouses();
  const warehouseId = currentWarehouse?.id;

  const handleUpgrade = async (tier: PlanTier) => {
    if (tier === 'free') return;
    if (!warehouseId) {
        toastError('Error', 'No active warehouse selected.');
        return;
    }
    
    setLoading(true);
    try {
      const result = await startSubscriptionAction(warehouseId, tier); 
      
      if (result.success) {
          toastSuccess('Request Logged', result.message);
          router.push('/billing');
      } else {
          toastError('Error', result.message);
      }
    } catch (err) {
      toastError('Error', 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      <PageHeader 
        title="Upgrade Your Plan" 
        description="Choose a plan that fits your warehouse operations and unlock advanced features."
        breadcrumbs={[
            { label: 'Dashboard', href: '/' },
            { label: 'Billing', href: '/billing' },
            { label: 'Upgrade' }
        ]}
      />

      <div className={loading ? 'opacity-50 pointer-events-none transition-opacity' : ''}>
        <PricingTable onSelect={handleUpgrade} />
      </div>

      <div className="text-center mt-8 text-sm text-muted-foreground">
        <p>Current plan: Free Tier</p>
        <p className="mt-2 italic">Note: In local development, some payment features might be simulated.</p>
      </div>
    </div>
  );
}
