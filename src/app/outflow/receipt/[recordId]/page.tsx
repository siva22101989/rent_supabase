'use client';
import { AppLayout } from "@/components/layout/app-layout";
import { PageHeader } from "@/components/shared/page-header";
import { OutflowReceipt } from "@/components/outflow/outflow-receipt";
import { notFound, useParams, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import type { Customer, StorageRecord } from "@/lib/definitions";
import { getStorageRecord, getCustomer } from "@/lib/data";

export default function OutflowReceiptPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const recordId = params.recordId as string;

  const [record, setRecord] = useState<StorageRecord | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);

  const withdrawnBags = Number(searchParams.get('withdrawn')) || 0;
  const finalRent = Number(searchParams.get('rent')) || 0;
  const paidNow = Number(searchParams.get('paidNow')) || 0;

  useEffect(() => {
    if (!recordId) return;
    async function fetchData() {
        const rec = await getStorageRecord(recordId);
        if (rec) {
            const cust = await getCustomer(rec.customerId);
            setRecord(rec);
            setCustomer(cust);
        }
        setLoading(false);
    }
    fetchData();
  }, [recordId]);

  if (loading) {
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
