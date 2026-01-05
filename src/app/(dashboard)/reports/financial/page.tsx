import { 
    getRevenueMetrics, 
    getMonthlyRevenueTrends, 
    getTopCustomersByRevenue,
    getAgingAnalysis,
    getCollectionMetrics
} from '@/lib/analytics';
import { FinancialDashboardClient } from './page-client';
import { fetchReportData } from '@/lib/report-actions';

export const dynamic = 'force-dynamic';

export default async function FinancialReportsPage() {
    const [
        revenueMetrics,
        monthlyTrends,
        topCustomers,
        agingAnalysis,
        collectionMetrics,
        hamaliRegisterRaw,
        unloadingRegisterRaw,
        unloadingExpensesRaw,
        rentPendingRaw
    ] = await Promise.all([
        getRevenueMetrics(),
        getMonthlyRevenueTrends(),
        getTopCustomersByRevenue(10),
        getAgingAnalysis(),
        getCollectionMetrics(),
        fetchReportData('hamali-register'),
        fetchReportData('unloading-register'),
        fetchReportData('unloading-expenses'),
        fetchReportData('rent-pending-breakdown')
    ]);

    return (
        <FinancialDashboardClient
            revenueMetrics={revenueMetrics}
            monthlyTrends={monthlyTrends}
            topCustomers={topCustomers}
            agingAnalysis={agingAnalysis}
            collectionMetrics={collectionMetrics}
            hamaliRecords={hamaliRegisterRaw?.data || []}
            unloadingRecords={unloadingRegisterRaw?.data || []}
            unloadingExpenses={unloadingExpensesRaw?.data || []}
            rentPendingBreakdown={rentPendingRaw?.data || []}
        />
    );
}
