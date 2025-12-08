
'use client';
import { AppLayout } from "@/components/layout/app-layout";
import { PageHeader } from "@/components/shared/page-header";
import { ReportClient } from "@/components/reports/report-client";
import { storageRecords as getStorageRecords, customers as getCustomers } from "@/lib/data";
import { useEffect, useState } from "react";
import type { Customer, StorageRecord } from "@/lib/definitions";

export default function ReportsPage() {
    const [allRecords, setAllRecords] = useState<StorageRecord[]>([]);
    const [allCustomers, setAllCustomers] = useState<Customer[]>([]);
    const [loading, setLoading] = useState(true);
    
    useEffect(() => {
        async function fetchData() {
            const [records, customers] = await Promise.all([
                getStorageRecords(),
                getCustomers()
            ]);
            setAllRecords(records);
            setAllCustomers(customers);
            setLoading(false);
        }
        fetchData();
    }, []);

    if (loading) {
        return <AppLayout><div>Loading...</div></AppLayout>;
    }
    
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
