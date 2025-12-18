

import { AppLayout } from "@/components/layout/app-layout";
import { PageHeader } from "@/components/shared/page-header";
import Link from "next/link";
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
import { getCustomers, getStorageRecords } from "@/lib/queries";
import { formatCurrency } from "@/lib/utils";

import type { Customer } from "@/lib/definitions";

export const dynamic = 'force-dynamic';

export default async function CustomersPage() {
  const [customers, records] = await Promise.all([
    getCustomers(),
    getStorageRecords()
  ]);

  return (
    <AppLayout>
      <PageHeader
        title="Customers"
        description="Manage your customers and view their activity."
      >
        <AddCustomerDialog />
      </PageHeader>
      <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Address</TableHead>
              <TableHead className="text-right">Active Bags</TableHead>
              <TableHead className="text-right">Total Due</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {customers?.map((customer) => {
              // Calculate insights
              const customerRecords = records.filter(r => r.customerId === customer.id);
              const activeBags = customerRecords
                .filter(r => !r.storageEndDate) // Only active
                .reduce((sum, r) => sum + r.bagsStored, 0);
              
              const totalDue = customerRecords.reduce((sum, r) => {
                 const totalBilled = (r.hamaliPayable || 0) + (r.totalRentBilled || 0);
                 const amountPaid = (r.payments || []).reduce((acc: any, p: any) => acc + p.amount, 0);
                 const balance = totalBilled - amountPaid;
                 // Only count positive balance (debt)
                 return sum + (balance > 0 ? balance : 0);
              }, 0);

              return (
              <TableRow key={customer.id}>
                <TableCell className="font-medium">
                    <Link href={`/customers/${customer.id}`} className="hover:underline">
                        <div className="text-base font-semibold text-primary">{customer.name}</div>
                    </Link>
                    <div className="text-xs text-muted-foreground">{customer.email}</div>
                </TableCell>
                <TableCell>{customer.phone}</TableCell>
                <TableCell>{customer.address}</TableCell>
                <TableCell className="text-right font-mono">
                    {activeBags > 0 ? (
                        <span className="font-medium text-green-600">{activeBags}</span>
                    ) : (
                        <span className="text-muted-foreground">-</span>
                    )}
                </TableCell>
                <TableCell className="text-right font-mono">
                    {totalDue > 0 ? (
                        <span className="font-bold text-destructive">{formatCurrency(totalDue)}</span>
                    ) : (
                        <span className="text-muted-foreground">-</span>
                    )}
                </TableCell>
              </TableRow>
            )})}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
    </AppLayout>
  );
}



