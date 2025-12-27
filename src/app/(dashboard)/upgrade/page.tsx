'use client';

import React, { useState } from 'react';
import { PageHeader } from '@/components/shared/page-header';
import { PricingTable } from '@/components/subscription/pricing-table';
import { useUnifiedToast } from '@/components/shared/toast-provider';
import { startSubscriptionAction } from '@/lib/subscription-actions';
import { PlanTier } from '@/lib/feature-flags';
import { useRouter } from 'next/navigation';

export default function UpgradePage() {
  const [loading, setLoading] = useState(false);
  const { success: toastSuccess, error: toastError } = useUnifiedToast();
  const router = useRouter();

  // In a real app, this would come from a warehouse context or URL param
  const warehouseId = 'default-placeholder'; 

  const handleUpgrade = async (tier: PlanTier) => {
    if (tier === 'free') return;
    
    setLoading(true);
    try {
      toastSuccess(
        'Request Logged', 
        'Your interest in the ' + tier + ' plan has been noted. Please contact the Super Admin at +91-XXXXXXXXXX (WhatsApp) to complete the manual payment and activation.'
      );
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
