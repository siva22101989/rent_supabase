import { 
    getRevenueMetrics, 
    getMonthlyRevenueTrends, 
    getTopCustomersByRevenue,
    getAgingAnalysis,
    getCollectionMetrics
} from '@/lib/analytics';
import { FinancialDashboardClient } from './page-client';

export const dynamic = 'force-dynamic';

export default async function FinancialReportsPage() {
    const [
        revenueMetrics,
        monthlyTrends,
        topCustomers,
        agingAnalysis,
        collectionMetrics
    ] = await Promise.all([
        getRevenueMetrics(),
        getMonthlyRevenueTrends(),
        getTopCustomersByRevenue(10),
        getAgingAnalysis(),
        getCollectionMetrics()
    ]);

    return (
        <FinancialDashboardClient
            revenueMetrics={revenueMetrics}
            monthlyTrends={monthlyTrends}
            topCustomers={topCustomers}
            agingAnalysis={agingAnalysis}
            collectionMetrics={collectionMetrics}
        />
    );
}
