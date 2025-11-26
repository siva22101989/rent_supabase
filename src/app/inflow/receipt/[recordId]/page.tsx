'use client';
import { AppLayout } from "@/components/layout/app-layout";
import { PageHeader } from "@/components/shared/page-header";
import { InflowReceipt } from "@/components/inflow/inflow-receipt";
import { getStorageRecord, getCustomer } from "@/lib/data";
import { notFound, useParams } from "next/navigation";
import { useDoc } from "@/firebase";
import { doc, getFirestore } from "firebase/firestore";
import { useFirestore } from "@/firebase";
import { useMemo } from "react";
import type { Customer, StorageRecord } from "@/lib/definitions";

export default function InflowReceiptPage() {
  const params = useParams();
  const recordId = params.recordId as string;
  const firestore = useFirestore();

  const recordRef = useMemo(() => {
    if (!firestore || !recordId) return null;
    return doc(firestore, 'storageRecords', recordId);
  }, [firestore, recordId]);

  const { data: record, loading: recordLoading } = useDoc<StorageRecord>(recordRef);

  const customerRef = useMemo(() => {
    if (!firestore || !record?.customerId) return null;
    return doc(firestore, 'customers', record.customerId);
  }, [firestore, record]);

  const { data: customer, loading: customerLoading } = useDoc<Customer>(customerRef);

  if (recordLoading || customerLoading) {
    return <AppLayout><div>Loading...</div></AppLayout>;
  }

  if (!record || !customer) {
    notFound();
  }
  
  return (
    <AppLayout>
      <PageHeader
        title="Inflow Receipt"
        description={`Details for storage record ${record.id}`}
      />
      <div className="flex justify-center">
        <InflowReceipt record={record} customer={customer} />
      </div>
    </AppLayout>
  );
}
