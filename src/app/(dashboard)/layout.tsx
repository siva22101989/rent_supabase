import { AppLayout } from '@/components/layout/app-layout';
import { getUserWarehouses, getUserWarehouse, getCurrentUserRole } from '@/lib/queries';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const warehouses = await getUserWarehouses();
  const currentWarehouseId = await getUserWarehouse();
  const userRole = await getCurrentUserRole();
  
  return (
    <AppLayout 
        warehouses={warehouses} 
        currentWarehouseId={currentWarehouseId || ''}
        userRole={userRole || ''}
    >
        {children}
    </AppLayout>
  );
}
