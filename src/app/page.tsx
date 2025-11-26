import { AppLayout } from "@/components/layout/app-layout";
import { PageHeader } from "@/components/shared/page-header";
import { BillingAlerts } from "@/components/dashboard/billing-alerts";
import { StorageTable } from "@/components/dashboard/storage-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { storageRecords } from "@/lib/data";

export default function DashboardPage() {
  const activeRecords = storageRecords.filter(record => !record.storageEndDate);

  return (
    <AppLayout>
      <PageHeader
        title="Dashboard"
        description="Overview of all active storage records and billing alerts."
      />
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Billing Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            <BillingAlerts records={activeRecords} />
          </CardContent>
        </Card>
        
        <Card>
            <CardHeader>
                <CardTitle>Active Storage</CardTitle>
            </CardHeader>
            <CardContent>
                <StorageTable />
            </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
