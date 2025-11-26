'use client';
import { AppLayout } from "@/components/layout/app-layout";
import { PageHeader } from "@/components/shared/page-header";
import { OutflowForm } from "@/components/outflow/outflow-form";
import { useCollection } from "@/firebase";
import { collection, query, where, orderBy } from "firebase/firestore";
import { useFirestore } from "@/firebase";
import { useMemo } from "react";
import type { Customer, StorageRecord } from "@/lib/definitions";

export default function OutflowPage() {
  const firestore = useFirestore();

  const customersQuery = useMemo(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'customers'), orderBy('name', 'asc'));
  }, [firestore]);
  const { data: customers, loading: customersLoading } = useCollection<Customer>(customersQuery);
  
  const recordsQuery = useMemo(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'storageRecords'), where('storageEndDate', '==', null));
  }, [firestore]);
  const { data: activeRecords, loading: recordsLoading } = useCollection<StorageRecord>(recordsQuery);

  if (customersLoading || recordsLoading) {
    return <AppLayout><div>Loading...</div></AppLayout>;
  }

  return (
    <AppLayout>
      <PageHeader
        title="Process Outflow"
        description="Select a record to process for withdrawal and generate a final bill."
      />
      <OutflowForm records={activeRecords || []} customers={customers || []} />
    </AppLayout>
  );
}
