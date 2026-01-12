import { 
    getCapacityMetrics,
    getLotUtilization,
    getTurnoverMetrics,
    getCommodityMetrics,
    getCustomerBehavior
} from '@/lib/operations-analytics';
import { OperationsDashboardClient } from './page-client';

export const dynamic = 'force-dynamic';

export default async function OperationsReportsPage() {
    const [
        capacityMetrics,
        lotUtilization,
        turnoverMetrics,
        commodityMetrics,
        customerBehavior
    ] = await Promise.all([
        getCapacityMetrics(),
        getLotUtilization(),
        getTurnoverMetrics(),
        getCommodityMetrics(),
        getCustomerBehavior()
    ]);

    // Check Feature Access
    const { getUserWarehouse } = await import('@/lib/queries');
    const { checkFeatureAccess } = await import('@/lib/subscription-actions');
    const warehouseId = await getUserWarehouse();
    const { allowed: allowExport } = warehouseId ? await checkFeatureAccess(warehouseId, 'allow_export') : { allowed: false };

    return (
        <OperationsDashboardClient
            capacityMetrics={capacityMetrics}
            lotUtilization={lotUtilization}
            turnoverMetrics={turnoverMetrics}
            commodityMetrics={commodityMetrics}
            customerBehavior={customerBehavior}
            allowExport={allowExport}
        />
    );
}
