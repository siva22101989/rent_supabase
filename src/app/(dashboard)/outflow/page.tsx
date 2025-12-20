import { PageHeader } from "@/components/shared/page-header";
import { OutflowForm } from "@/components/outflow/outflow-form";
import { getStorageRecords, getRecentOutflows } from "@/lib/queries";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState } from "@/components/ui/empty-state";
import { ArrowUpFromDot } from "lucide-react";
import { MobileCard } from "@/components/ui/mobile-card";
import { DeleteOutflowButton } from "@/components/outflow/delete-outflow-button";
import { EditOutflowDialog } from "@/components/outflow/edit-outflow-dialog";


export const dynamic = 'force-dynamic';

export default async function OutflowPage() {
  const records = await getStorageRecords(); 
  const recentOutflows = await getRecentOutflows(5);
  
  const activeRecords = records.filter(r => !r.storageEndDate);

  return (
    <>
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
      <div className="mt-8">
        <h3 className="text-lg font-medium mb-4">Recent Withdrawals</h3>
        <div className="md:hidden space-y-4">
          {recentOutflows.map((record) => (
             <MobileCard key={record.id}>
               <MobileCard.Header>
                 <div className="flex-1">
                   <MobileCard.Title>{record.customerName}</MobileCard.Title>
                   <p className="text-xs text-muted-foreground mt-1">
                     {record.date.toLocaleDateString()} • Inv #{record.invoiceNo}
                   </p>
                 </div>
                 <MobileCard.Badge variant="destructive">-{record.bags} Bags</MobileCard.Badge>
               </MobileCard.Header>
               <MobileCard.Content>
                  <MobileCard.Row label="Item" value={record.commodity} />
               </MobileCard.Content>
               <MobileCard.Actions>
                  <div className="w-full flex justify-end gap-2">
                    <EditOutflowDialog transaction={record} />
                    <DeleteOutflowButton 
                        transactionId={record.id} 
                        bags={record.bags}
                        rentCollected={record.rentCollected || 0}
                    />
                  </div>
               </MobileCard.Actions>
             </MobileCard>
           ))}
           {recentOutflows.length === 0 && (
              <EmptyState
                icon={ArrowUpFromDot}
                title="No withdrawals yet"
                description="Your recent withdrawals will appear here once you process your first outflow using the form above."
              />
           )}
        </div>

        <div className="rounded-md border bg-card hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date Out</TableHead>
                  <TableHead>ID</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Item</TableHead>
                  <TableHead className="text-right">Bags</TableHead>
                  <TableHead className="w-[100px]"></TableHead>
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
                        <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                                <EditOutflowDialog transaction={record} />
                                <DeleteOutflowButton 
                                    transactionId={record.id} 
                                    bags={record.bags}
                                    rentCollected={record.rentCollected || 0}
                                />
                            </div>
                        </TableCell>
                      </TableRow>
                    );
                   })}
                 {recentOutflows.length === 0 && (
                   <TableRow>
                     <TableCell colSpan={6} className="h-48">
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
    </>
  );
}
