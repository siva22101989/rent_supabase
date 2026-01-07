import { AppLayout } from '@/components/layout/app-layout';
import { WarehouseProvider } from '@/contexts/warehouse-context';
import { CustomerProvider } from '@/contexts/customer-context';
import { StaticDataProvider } from '@/hooks/use-static-data';
import { AuthListener } from '@/components/auth/auth-listener';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <WarehouseProvider>
      <StaticDataProvider>
        <CustomerProvider>
          <AuthListener />
          <AppLayout>
              {children}
          </AppLayout>
        </CustomerProvider>
      </StaticDataProvider>
    </WarehouseProvider>
  );
}
