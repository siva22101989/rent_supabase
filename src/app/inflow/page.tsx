import { AppLayout } from "@/components/layout/app-layout";
import { PageHeader } from "@/components/shared/page-header";
import { InflowForm } from "@/components/inflow/inflow-form";
import { AddCustomerDialog } from "@/components/customers/add-customer-dialog";
import { getRecentInflows } from "@/lib/queries";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState } from "@/components/ui/empty-state";
import { ArrowDownToDot } from "lucide-react";


export const dynamic = 'force-dynamic';

export default async function InflowPage() {
    const records = await getRecentInflows(5);

  // Removed manual sequence logic as it is now handled server-side
  const nextSerialNumber = "Auto-Generated";

  return (
    <AppLayout>
      <PageHeader
        title="Add Inflow"
        description="Create a new storage record for a customer."
        breadcrumbs={[
          { label: 'Dashboard', href: '/' },
          { label: 'Inflow' }
        ]}
      >
        <AddCustomerDialog />
      </PageHeader>
      <InflowForm nextSerialNumber={nextSerialNumber} />

      {/* Recent Inflows Table */}
      <div className="mt-8">
        <h3 className="text-lg font-medium mb-4">Recent Inflows</h3>
        <div className="rounded-md border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>ID</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Item</TableHead>
                  <TableHead className="text-right">Bags</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {records.map((record) => {
                     return (
                      <TableRow key={record.id}>
                        <TableCell>{record.date.toLocaleDateString()}</TableCell>
                        <TableCell className="font-medium font-mono">{record.id}</TableCell>
                        <TableCell>{record.customerName}</TableCell>
                        <TableCell>{record.commodity}</TableCell>
                        <TableCell className="text-right">{record.bags}</TableCell>
                      </TableRow>
                    );
                   })}
                 {records.length === 0 && (
                   <TableRow>
                     <TableCell colSpan={5} className="h-48">
                       <EmptyState
                         icon={ArrowDownToDot}
                         title="No inflow records yet"
                         description="Your recent inflows will appear here once you add your first storage record using the form above."
                       />
                     </TableCell>
                   </TableRow>
                 )}
              </TableBody>
            </Table>
        </div>
      </div>
    </AppLayout>
  );
}
