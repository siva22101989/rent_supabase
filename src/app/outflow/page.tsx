import { AppLayout } from "@/components/layout/app-layout";
import { PageHeader } from "@/components/shared/page-header";
import { OutflowForm } from "@/components/outflow/outflow-form";
import { getCustomers, getStorageRecords, getAvailableCrops } from "@/lib/queries";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export const dynamic = 'force-dynamic';

export default async function OutflowPage() {
  const [customers, records, crops] = await Promise.all([
    getCustomers(),
    getStorageRecords(),
    getAvailableCrops()
  ]);
  
  const activeRecords = records.filter(r => !r.storageEndDate);

  return (
    <AppLayout>
      <PageHeader
        title="Process Outflow"
        description="Select a record to process for withdrawal and generate a final bill."
      />
      <OutflowForm records={activeRecords || []} customers={customers || []} crops={crops || []} />

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
                {records
                   .filter(r => r.storageEndDate) // Only show completed/outflow records
                   .sort((a, b) => new Date(b.storageEndDate!).getTime() - new Date(a.storageEndDate!).getTime())
                   .slice(0, 5)
                   .map((record) => {
                     const customerName = customers?.find(c => c.id === record.customerId)?.name || 'Unknown';
                     return (
                      <TableRow key={record.id}>
                        <TableCell>{new Date(record.storageEndDate!).toLocaleDateString()}</TableCell>
                        <TableCell className="font-medium">{record.id}</TableCell>
                        <TableCell>{customerName}</TableCell>
                        <TableCell>{record.commodityDescription}</TableCell>
                        <TableCell className="text-right">{record.bagsStored}</TableCell>
                      </TableRow>
                    );
                   })}
                 {records.filter(r => r.storageEndDate).length === 0 && (
                   <TableRow>
                     <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                        No recent withdrawals.
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
