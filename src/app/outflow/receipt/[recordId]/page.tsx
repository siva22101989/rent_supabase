'use client';
import { AppLayout } from "@/components/layout/app-layout";
import { PageHeader } from "@/components/shared/page-header";
import { OutflowReceipt } from "@/components/outflow/outflow-receipt";
import { notFound, useParams, useSearchParams } from "next/navigation";
import { useDoc } from "@/firebase";
import { doc } from "firebase/firestore";
import { useFirestore } from "@/firebase";
import { useMemo } from "react";
import type { Customer, StorageRecord } from "@/lib/definitions";

export default function OutflowReceiptPage() {
  const params = useParams();
  const searchParams = useSearchParams();
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

  const withdrawnBags = Number(searchParams.get('withdrawn')) || 0;
  const finalRent = Number(searchParams.get('rent')) || 0;
  const paidNow = Number(searchParams.get('paidNow')) || 0;

  if (recordLoading || customerLoading) {
    return <AppLayout><div>Loading...</div></AppLayout>;
  }

  if (!record || !customer) {
    notFound();
  }
  
  return (
    <AppLayout>
      <PageHeader
        title="Outflow Receipt"
        description={`Final bill for storage record ${record.id}`}
      />
      <div className="flex justify-center">
        <OutflowReceipt 
            record={record} 
            customer={customer}
            withdrawnBags={withdrawnBags}
            finalRent={finalRent}
            paidNow={paidNow}
        />
      </div>
    </AppLayout>
  );
}
