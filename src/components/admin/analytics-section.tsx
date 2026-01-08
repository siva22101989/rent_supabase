'use client';

import dynamic from 'next/dynamic';
// import { PlatformAnalyticsCharts } from '@/components/admin/analytics-charts';
const PlatformAnalyticsCharts = dynamic(() => import('@/components/admin/analytics-charts').then(mod => mod.PlatformAnalyticsCharts), {
    loading: () => <div className="h-[300px] flex items-center justify-center text-muted-foreground">Loading Charts...</div>,
    ssr: false
});

import { useFeatureGate, FEATURES } from '@/lib/feature-flags';
import { UpgradeBanner } from '@/components/shared/upgrade-banner';

interface AnalyticsSectionProps {
    data: any;
}

export function AnalyticsSection({ data }: AnalyticsSectionProps) {
    const { checkFeature, isLoading } = useFeatureGate();
    const canViewAnalytics = checkFeature(FEATURES.ANALYTICS_DASHBOARD);

    if (isLoading) {
        return <div className="h-[300px] flex items-center justify-center text-muted-foreground">Loading...</div>;
    }

    if (!canViewAnalytics) {
        return (
            <UpgradeBanner 
                title="Analytics Dashboard Locked"
                description="Upgrade to the Professional plan to view detailed platform analytics and growth insights."
                type="blocker"
            />
        );
    }

    return <PlatformAnalyticsCharts data={data} />;
}
