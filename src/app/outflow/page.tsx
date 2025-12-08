
'use client';
import { AppLayout } from "@/components/layout/app-layout";
import { PageHeader } from "@/components/shared/page-header";
import { OutflowForm } from "@/components/outflow/outflow-form";
import { customers as getCustomers, storageRecords as getStorageRecords } from "@/lib/data";
import { useEffect, useState } from "react";
import type { Customer, StorageRecord } from "@/lib/definitions";

export default function OutflowPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [activeRecords, setActiveRecords] = useState<StorageRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      const [customersData, recordsData] = await Promise.all([
        getCustomers(),
        getStorageRecords()
      ]);
      setCustomers(customersData);
      setActiveRecords(recordsData.filter(r => !r.storageEndDate));
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
        title="Process Outflow"
        description="Select a record to process for withdrawal and generate a final bill."
      />
      <OutflowForm records={activeRecords || []} customers={customers || []} />
    </AppLayout>
  );
}
