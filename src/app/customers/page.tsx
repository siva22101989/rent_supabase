'use client';
import { AppLayout } from "@/components/layout/app-layout";
import { PageHeader } from "@/components/shared/page-header";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { AddCustomerDialog } from "@/components/customers/add-customer-dialog";
import { customers as getCustomers } from "@/lib/data";
import { useEffect, useState } from "react";
import type { Customer } from "@/lib/definitions";

function CustomersTable() {
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
    return <div>Loading...</div>;
  }

  return (
    <Card>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Address</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {customers?.map((customer) => (
              <TableRow key={customer.id}>
                <TableCell className="font-medium">{customer.name}</TableCell>
                <TableCell>{customer.email}</TableCell>
                <TableCell>{customer.phone}</TableCell>
                <TableCell>{customer.address}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}


export default function CustomersPage() {
  return (
    <AppLayout>
      <PageHeader
        title="Customers"
        description="Manage your customers."
      >
        <AddCustomerDialog />
      </PageHeader>
      <CustomersTable />
    </AppLayout>
  );
}
