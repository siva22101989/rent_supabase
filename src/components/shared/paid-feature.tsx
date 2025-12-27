'use client';

import React from 'react';
import { useFeatureGate, FeatureGate, PlanTier } from '@/lib/feature-flags';
import { Button } from '@/components/ui/button';
import { Lock } from 'lucide-react';
import Link from 'next/link';

interface PaidFeatureProps {
  feature: FeatureGate;
  currentPlan?: PlanTier;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * Component wrapper to conditionally show/hide or dim features based on the user's plan.
 */
export function PaidFeature({ feature, children, fallback }: Omit<PaidFeatureProps, 'currentPlan'>) {
  const { checkFeature, isLoading } = useFeatureGate();
  
  if (isLoading) {
      return <div className="animate-pulse">{children}</div>;
  }

  const isEnabled = checkFeature(feature);

  if (isEnabled) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  // Default fallback: a subtle locked UI
  return (
    <div className="relative group cursor-not-allowed">
      <div className="filter blur-[1px] opacity-50 pointer-events-none">
        {children}
      </div>
      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="bg-background/80 backdrop-blur-sm border rounded-lg p-3 shadow-lg flex flex-col items-center gap-2">
          <Lock className="h-5 w-5 text-muted-foreground" />
          <p className="text-xs font-medium uppercase">{feature.tier} PLAN REQUIRED</p>
          <Button size="sm" variant="outline" className="h-7 text-[10px]" asChild>
            <Link href="/upgrade">Upgrade Now</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
