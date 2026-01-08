import { AnalyticsService } from '@/lib/services/analytics';
import { AnalyticsPageClient } from './client';
import { PageHeader } from "@/components/shared/page-header";

export default async function AnalyticsPage() {
    const currentYear = new Date().getFullYear();
    
    const [financialData, stockData, yearlyData] = await Promise.all([
        AnalyticsService.getMonthlyFinancials(currentYear),
        AnalyticsService.getStockTrends(currentYear),
        AnalyticsService.getYearlyComparison(currentYear - 4, currentYear) // Last 5 years
    ]);

    return (
        <>
            <PageHeader
                title="Business Analytics"
                description={`Financial and stock performance for ${currentYear}`}
                breadcrumbs={[
                    { label: 'Dashboard', href: '/' },
                    { label: 'Analytics' }
                ]}
            />
            <AnalyticsPageClient 
                financialData={financialData} 
                stockData={stockData} 
                yearlyData={yearlyData}
                year={currentYear}
            />
        </>
    );
}
