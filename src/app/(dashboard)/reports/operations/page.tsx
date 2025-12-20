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

    return (
        <OperationsDashboardClient
            capacityMetrics={capacityMetrics}
            lotUtilization={lotUtilization}
            turnoverMetrics={turnoverMetrics}
            commodityMetrics={commodityMetrics}
            customerBehavior={customerBehavior}
        />
    );
}
