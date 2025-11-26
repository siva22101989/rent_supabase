'use client';
import { AppLayout } from "@/components/layout/app-layout";
import { PageHeader } from "@/components/shared/page-header";
import { InflowForm } from "@/components/inflow/inflow-form";
import { AddCustomerDialog } from "@/components/customers/add-customer-dialog";
import { useCollection } from "@/firebase";
import { collection, query, orderBy } from "firebase/firestore";
import { useFirestore } from "@/firebase";
import { useMemo } from "react";
import type { Customer } from "@/lib/definitions";

export default function InflowPage() {
  const firestore = useFirestore();
  const customersQuery = useMemo(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'customers'), orderBy('name', 'asc'));
  }, [firestore]);

  const { data: customers, loading } = useCollection<Customer>(customersQuery);

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
