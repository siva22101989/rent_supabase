
'use client';
import { AppLayout } from "@/components/layout/app-layout";
import { PageHeader } from "@/components/shared/page-header";
import { InflowReceipt } from "@/components/inflow/inflow-receipt";
import { getStorageRecord, getCustomer } from "@/lib/data";
import { notFound, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import type { Customer, StorageRecord } from "@/lib/definitions";

export default function InflowReceiptPage() {
  const params = useParams();
  const recordId = params.recordId as string;
  
  const [record, setRecord] = useState<StorageRecord | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);

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
        title="Inflow Receipt"
        description={`Details for storage record ${record.id}`}
      />
      <div className="flex justify-center">
        <InflowReceipt record={record} customer={customer} />
      </div>
    </AppLayout>
  );
}
