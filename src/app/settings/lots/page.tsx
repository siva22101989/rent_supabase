import { AppLayout } from '@/components/layout/app-layout';
import { createClient } from '@/utils/supabase/server';
export const dynamic = 'force-dynamic';
import { getUserWarehouse } from "@/lib/queries";
import { redirect } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { addLot, bulkAddLots, addLotsFromList, deleteLot } from '@/lib/lots-actions';
import Link from 'next/link';
import { ArrowLeft, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { EditLotDialog } from '@/components/lots/edit-lot-dialog';

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
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
            <Link href="/settings">
                <ArrowLeft className="h-4 w-4" />
            </Link>
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">Warehouse Lots</h1>
      </div>

      <div className="flex gap-4">
        {/* Add Single Lot Dialog */}
        <Dialog>
            <DialogTrigger asChild>
                <Button>Add Single Lot</Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Add New Lot</DialogTitle>
                </DialogHeader>
                <form action={addLot} className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="name">Lot Name</Label>
                        <Input id="name" name="name" placeholder="e.g. A-1" required />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="capacity">Capacity (Bags)</Label>
                        <Input id="capacity" name="capacity" type="number" placeholder="1000" defaultValue="1000" />
                    </div>
                    <Button type="submit">Create Lot</Button>
                </form>
            </DialogContent>
        </Dialog>

        {/* Bulk Add Dialog */}
        <Dialog>
             <DialogTrigger asChild>
                <Button variant="secondary">Bulk Add Lots</Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Bulk Add Lots</DialogTitle>
                </DialogHeader>
                <form action={bulkAddLots} className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="prefix">Prefix</Label>
                        <Input id="prefix" name="prefix" placeholder="e.g. Row A-" required />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="start">Start Number</Label>
                            <Input id="start" name="start" type="number" placeholder="1" required />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="end">End Number</Label>
                            <Input id="end" name="end" type="number" placeholder="50" required />
                        </div>
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="capacity">Capacity per Lot (Bags)</Label>
                        <Input id="capacity" name="capacity" type="number" placeholder="1000" defaultValue="1000" />
                    </div>
                    <Button type="submit">Generate Lots</Button>
                </form>
            </DialogContent>
        </Dialog>

        {/* Paste List Dialog */}
        <Dialog>
             <DialogTrigger asChild>
                <Button variant="outline">Paste List</Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Paste Lot List</DialogTitle>
                </DialogHeader>
                <form action={addLotsFromList} className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="list_content">Lot Names</Label>
                        <p className="text-xs text-muted-foreground">Separate by comma or new line (e.g. "A1, A2, B1")</p>
                        <textarea 
                            id="list_content" 
                            name="list_content" 
                            className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            placeholder="A1, A2, A3..." 
                            required 
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="capacity">Capacity per Lot (Bags)</Label>
                        <Input id="capacity" name="capacity" type="number" placeholder="1000" defaultValue="1000" />
                    </div>
                    <Button type="submit">Add Lots</Button>
                </form>
            </DialogContent>
        </Dialog>
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
                                    <form action={deleteLot.bind(null, lot.id)}>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                                            <Trash2 className="h-4 w-4" />
                                            <span className="sr-only">Delete</span>
                                        </Button>
                                    </form>
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
