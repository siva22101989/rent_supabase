'use client';
import { AppLayout } from "@/components/layout/app-layout";
import { PageHeader } from "@/components/shared/page-header";
import { InflowForm } from "@/components/inflow/inflow-form";
import { AddCustomerDialog } from "@/components/customers/add-customer-dialog";
import { customers as getCustomers } from "@/lib/data";
import { useEffect, useState } from "react";
import type { Customer } from "@/lib/definitions";

export default function InflowPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    async function fetchCustomers() {
      const data = await getCustomers();
      setCustomers(data);
      setLoading(false);
    }
    fetchCustomers();
  }, []);

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
      <InflowForm customers={customers || []} />
    </AppLayout>
  );
}
