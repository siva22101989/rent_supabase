import { AppLayout } from '@/components/layout/app-layout';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { EditLotDialog } from '@/components/lots/edit-lot-dialog';
import { createClient } from '@/utils/supabase/server';
export const dynamic = 'force-dynamic';
import { getUserWarehouse } from "@/lib/queries";
import { redirect } from 'next/navigation';
import { AddLotDialog } from '@/components/lots/add-lot-dialog';
import { BulkAddLotsDialog } from '@/components/lots/bulk-add-lots-dialog';
import { PasteLotListDialog } from '@/components/lots/paste-lot-list-dialog';
import { DeleteLotButton } from '@/components/lots/delete-lot-button';

import { PageHeader } from '@/components/shared/page-header';

export default async function LotsPage() {
  const warehouseId = await getUserWarehouse();
  if (!warehouseId) redirect('/login');

  const supabase = await createClient();
  const { data: lots } = await supabase
    .from('warehouse_lots')
    .select('*')
    .eq('warehouse_id', warehouseId)
    .order('created_at', { ascending: true });

  return (
    <AppLayout>
    <div className="flex flex-col gap-6">
      <PageHeader 
        title="Warehouse Lots" 
        backHref="/settings"
        breadcrumbs={[
          { label: 'Dashboard', href: '/' },
          { label: 'Settings', href: '/settings' },
          { label: 'Lots' }
        ]}
      />


      <div className="flex gap-4">
        <AddLotDialog />
        <BulkAddLotsDialog />
        <PasteLotListDialog />
      </div>

      <Card>
        <CardContent className="p-0">
             <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Lot Name</TableHead>
                        <TableHead>Capacity</TableHead>
                        <TableHead>Utilization</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="w-[100px]">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {lots?.map((lot) => (
                        <TableRow key={lot.id}>
                            <TableCell className="font-medium">{lot.name}</TableCell>
                            <TableCell>{lot.capacity || 1000} bags</TableCell>
                            <TableCell>
                                <div className="flex items-center gap-2">
                                    <span className={lot.current_stock > (lot.capacity || 1000) ? "text-destructive font-bold" : ""}>
                                        {lot.current_stock || 0}
                                    </span>
                                    <div className="h-2 w-20 bg-secondary rounded-full overflow-hidden">
                                        <div 
                                            className={`h-full ${lot.current_stock > (lot.capacity || 1000) ? 'bg-destructive' : 'bg-primary'}`} 
                                            style={{ width: `${Math.min(((lot.current_stock || 0) / (lot.capacity || 1000)) * 100, 100)}%` }}
                                        />
                                    </div>
                                </div>
                            </TableCell>
                            <TableCell>{lot.status}</TableCell>
                            <TableCell>
                                <div className="flex items-center gap-1">
                                    <EditLotDialog 
                                        lot={{
                                            id: lot.id,
                                            name: lot.name,
                                            capacity: lot.capacity || 1000
                                        }}
                                    />
                                    <DeleteLotButton lotId={lot.id} lotName={lot.name} />
                                </div>
                            </TableCell>
                        </TableRow>
                    ))}
                     {(!lots || lots.length === 0) && (
                        <TableRow>
                            <TableCell colSpan={3} className="text-center text-muted-foreground p-8">
                                No lots created yet. Use the buttons above to add some.
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </CardContent>
      </Card>
    </div>
    </AppLayout>
  );
}
