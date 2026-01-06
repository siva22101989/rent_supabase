import { AppLayout } from '@/components/layout/app-layout';
import { getUserWarehouses, getUserWarehouse, getCurrentUserRole } from '@/lib/queries';
import { WarehouseProvider } from '@/contexts/warehouse-context';
import { CustomerProvider } from '@/contexts/customer-context';
import { StaticDataProvider } from '@/hooks/use-static-data';
import { AuthListener } from '@/components/auth/auth-listener';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const warehouses = await getUserWarehouses();
  const currentWarehouseId = await getUserWarehouse();
  const userRole = await getCurrentUserRole();
  
  return (
    <WarehouseProvider>
      <StaticDataProvider>
        <CustomerProvider>
          <AuthListener />
          <AppLayout 
              warehouses={warehouses} 
              currentWarehouseId={currentWarehouseId || ''}
              userRole={userRole || ''}
          >
              {children}
          </AppLayout>
        </CustomerProvider>
      </StaticDataProvider>
    </WarehouseProvider>
  );
}
