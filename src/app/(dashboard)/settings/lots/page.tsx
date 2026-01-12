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
import { MobileCard } from '@/components/ui/mobile-card';
import { EmptyState } from '@/components/ui/empty-state';
import { Box } from 'lucide-react';

import { PageHeader } from '@/components/shared/page-header';

export default async function LotsPage() {
  const warehouseId = await getUserWarehouse();
  if (!warehouseId) redirect('/login');

  const supabase = await createClient();
  const { data: lots } = await supabase
    .from('warehouse_lots')
    .select('*')
    .eq('warehouse_id', warehouseId)
    .is('deleted_at', null)
    .order('created_at', { ascending: true });

  return (
    <>
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
            <div className="md:hidden space-y-4 p-4 pt-0">
                {lots?.map((lot) => (
                    <MobileCard key={lot.id}>
                        <MobileCard.Header>
                            <div className="flex-1">
                                <MobileCard.Title>{lot.name}</MobileCard.Title>
                                <p className="text-xs text-muted-foreground mt-1">
                                    {lot.status}
                                </p>
                            </div>
                            <MobileCard.Badge>{lot.capacity || 1000} bags</MobileCard.Badge>
                        </MobileCard.Header>
                        <MobileCard.Content>
                           <div className="flex justify-between items-center text-sm mb-2">
                                <span className="text-muted-foreground">Utilization:</span>
                                <span className={`font-medium ${lot.current_stock > (lot.capacity || 1000) ? "text-destructive" : ""}`}>
                                    {lot.current_stock || 0} / {lot.capacity || 1000}
                                </span>
                           </div>
                           <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                                <div
                                    className={`h-full ${lot.current_stock > (lot.capacity || 1000) ? 'bg-destructive' : 'bg-primary'}`}
                                    style={{ width: `${Math.min(((lot.current_stock || 0) / (lot.capacity || 1000)) * 100, 100)}%` }}
                                />
                            </div>
                        </MobileCard.Content>
                        <MobileCard.Actions>
                            <div className="flex items-center justify-end gap-1 w-full">
                                <EditLotDialog
                                    lot={{
                                        id: lot.id,
                                        name: lot.name,
                                        capacity: lot.capacity || 1000
                                    }}
                                />
                                <DeleteLotButton lotId={lot.id} lotName={lot.name} />
                            </div>
                        </MobileCard.Actions>
                    </MobileCard>
                ))}
                {(!lots || lots.length === 0) && (
                    <EmptyState
                        icon={Box}
                        title="No lots created yet"
                        description="Use the buttons above to add some."
                    />
                )}
            </div>

             <div className="hidden md:block">
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
            </div>
        </CardContent>
      </Card>
    </div>
    </>
  );
}
