import { AppLayout } from '@/components/layout/app-layout';
import { getUserWarehouses, getUserWarehouse } from '@/lib/queries';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const warehouses = await getUserWarehouses();
  const currentWarehouseId = await getUserWarehouse();
  
  return <AppLayout warehouses={warehouses} currentWarehouseId={currentWarehouseId || ''}>{children}</AppLayout>;
}
