
'use client';
import { AppLayout } from "@/components/layout/app-layout";
import { PageHeader } from "@/components/shared/page-header";
import { InflowForm } from "@/components/inflow/inflow-form";
import { AddCustomerDialog } from "@/components/customers/add-customer-dialog";
import { customers as getCustomers, storageRecords as getStorageRecords } from "@/lib/data";
import { useEffect, useState, useMemo } from "react";
import type { Customer, StorageRecord } from "@/lib/definitions";

export default function InflowPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [records, setRecords] = useState<StorageRecord[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    async function fetchData() {
      const [customerData, recordData] = await Promise.all([
        getCustomers(),
        getStorageRecords(),
      ]);
      setCustomers(customerData);
      setRecords(recordData);
      setLoading(false);
    }
    fetchData();
  }, []);

  const nextSerialNumber = useMemo(() => {
    if (records.length === 0) {
      return 'SLWH-1';
    }
    const maxId = records.reduce((max, record) => {
      const idNum = parseInt(record.id.replace('SLWH-', ''), 10);
      return isNaN(idNum) ? max : Math.max(max, idNum);
    }, 0);
    return `SLWH-${maxId + 1}`;
  }, [records]);


  if (loading) {
    return <AppLayout><div>Loading...</div></AppLayout>;
  }

  return (
    <AppLayout>
      <PageHeader
        title="Add Inflow"
        description="Create a new storage record for a customer."
      >
        <AddCustomerDialog />
      </PageHeader>
      <InflowForm customers={customers || []} nextSerialNumber={nextSerialNumber} />
    </AppLayout>
  );
}
