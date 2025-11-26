'use client';
import { AppLayout } from "@/components/layout/app-layout";
import { PageHeader } from "@/components/shared/page-header";
import { useCollection } from "@/firebase";
import { ReportClient } from "@/components/reports/report-client";
import { collection, query, orderBy } from "firebase/firestore";
import { useFirestore } from "@/firebase";
import { useMemo } from "react";
import type { Customer, StorageRecord } from "@/lib/definitions";

export default function ReportsPage() {
    const firestore = useFirestore();

    const recordsQuery = useMemo(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'storageRecords'), orderBy('storageStartDate', 'desc'));
    }, [firestore]);
    const { data: allRecords, loading: recordsLoading } = useCollection<StorageRecord>(recordsQuery);

    const customersQuery = useMemo(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'customers'));
    }, [firestore]);
    const { data: allCustomers, loading: customersLoading } = useCollection<Customer>(customersQuery);

    if (recordsLoading || customersLoading) {
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
