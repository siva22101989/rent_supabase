import { AppLayout } from "@/components/layout/app-layout";
import { PageHeader } from "@/components/shared/page-header";
import { OutflowForm } from "@/components/outflow/outflow-form";
import { getStorageRecords, getRecentOutflows } from "@/lib/queries";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState } from "@/components/ui/empty-state";
import { ArrowUpFromDot } from "lucide-react";


export const dynamic = 'force-dynamic';

export default async function OutflowPage() {
  const records = await getStorageRecords(); 
  const recentOutflows = await getRecentOutflows(5);
  
  const activeRecords = records.filter(r => !r.storageEndDate);

  return (
    <AppLayout>
      <PageHeader
        title="Process Outflow"
        description="Select a record to process for withdrawal and generate a final bill."
        breadcrumbs={[
          { label: 'Dashboard', href: '/' },
          { label: 'Outflow' }
        ]}
      />
      <OutflowForm records={activeRecords || []} />

      {/* Recent Withdrawals Table */}
      {/* Recent Withdrawals Table */}
      <div className="mt-8">
        <h3 className="text-lg font-medium mb-4">Recent Withdrawals</h3>
        <div className="rounded-md border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date Out</TableHead>
                  <TableHead>ID</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Item</TableHead>
                  <TableHead className="text-right">Bags</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentOutflows.map((record) => {
                     return (
                      <TableRow key={record.id}>
                        <TableCell>{record.date.toLocaleDateString()}</TableCell>
                        <TableCell className="font-medium font-mono">{record.invoiceNo}</TableCell>
                        <TableCell>{record.customerName}</TableCell>
                        <TableCell>{record.commodity}</TableCell>
                        <TableCell className="text-right">{record.bags}</TableCell>
                      </TableRow>
                    );
                   })}
                 {recentOutflows.length === 0 && (
                   <TableRow>
                     <TableCell colSpan={5} className="h-48">
                       <EmptyState
                         icon={ArrowUpFromDot}
                         title="No withdrawals yet"
                         description="Your recent withdrawals will appear here once you process your first outflow using the form above."
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
