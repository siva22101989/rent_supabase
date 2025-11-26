
import { AppLayout } from "@/components/layout/app-layout";
import { PageHeader } from "@/components/shared/page-header";
import { StorageTable } from "@/components/dashboard/storage-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { storageRecords as getStorageRecords } from "@/lib/data";

export default async function DashboardPage() {
  return (
    <AppLayout>
      <PageHeader
        title="Dashboard"
        description="Overview of all active storage records."
      />
      <div className="space-y-6">
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
