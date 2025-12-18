import { AppLayout } from "@/components/layout/app-layout";
import { PageHeader } from "@/components/shared/page-header";
import { ReportClient } from "@/components/reports/report-client";
import { getStorageRecords, getCustomers } from "@/lib/queries";

export const dynamic = 'force-dynamic';

export default async function ReportsPage() {
    const [allRecords, allCustomers] = await Promise.all([
        getStorageRecords(),
        getCustomers()
    ]);

  return (
    <AppLayout>
      <PageHeader
        title="All Transactions Report"
        description="A complete log of all storage records, filterable by customer."
      />
      <ReportClient records={allRecords || []} customers={allCustomers || []} />
    </AppLayout>
  );
}
