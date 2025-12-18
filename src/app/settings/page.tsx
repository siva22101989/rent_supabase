import { AppLayout } from "@/components/layout/app-layout";
import { createClient } from '@/utils/supabase/server';
export const dynamic = 'force-dynamic';
import { getUserWarehouse } from '@/lib/queries';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { updateWarehouseDetails, addCrop, deleteCrop, seedDatabase } from '@/lib/admin-actions';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Trash2 } from 'lucide-react';

export default async function SettingsPage() {
  const warehouseId = await getUserWarehouse();
  if (!warehouseId) {
    redirect('/login');
  }

  const supabase = await createClient();
  
  // Fetch Warehouse Details
  const { data: warehouse } = await supabase
    .from('warehouses')
    .select('*')
    .eq('id', warehouseId)
    .single();

  // Fetch Crops
  const { data: crops } = await supabase
    .from('crops')
    .select('*')
    .eq('warehouse_id', warehouseId)
    .order('name');

  return (
    <AppLayout>
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
      </div>

      <div className="grid gap-6">
        {/* Warehouse Settings */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="flex flex-col space-y-1.5">
                <CardTitle>Warehouse Details</CardTitle>
                <CardDescription>
                  Update your warehouse information.
                </CardDescription>
            </div>
            <Button variant="outline" size="sm" asChild>
                <Link href="/settings/lots">Manage Lots</Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
                <Link href="/settings/team">Manage Team</Link>
            </Button>
            <form action={seedDatabase}>
                 <Button variant="destructive" size="sm">Reset & Heavy Seed</Button>
            </form>
          </CardHeader>
          <CardContent>
            <form action={updateWarehouseDetails} className="grid gap-4 md:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="name">Warehouse Name</Label>
                <Input id="name" name="name" defaultValue={warehouse?.name || ''} required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="location">Location</Label>
                <Input id="location" name="location" defaultValue={warehouse?.location || ''} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="capacity">Capacity (Bags)</Label>
                <Input id="capacity" name="capacity" type="number" defaultValue={warehouse?.capacity_bags || ''} />
              </div>
              <div className="flex items-end">
                <Button type="submit">Save Changes</Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Crop Management */}
        <Card>
          <CardHeader>
            <CardTitle>Crop Management</CardTitle>
            <CardDescription>
              Configure the crops you store and their standard rates.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6">
            
             {/* List Crops */}
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Crop Name</TableHead>
                            <TableHead>Bag Weight (kg)</TableHead>
                            <TableHead>Rent (6M)</TableHead>
                            <TableHead>Rent (1Y)</TableHead>
                            <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {crops?.map((crop) => (
                            <TableRow key={crop.id}>
                                <TableCell className="font-medium">{crop.name}</TableCell>
                                <TableCell>{crop.standard_bag_weight_kg} kg</TableCell>
                                <TableCell>₹{crop.rent_price_6m}</TableCell>
                                <TableCell>₹{crop.rent_price_1y}</TableCell>
                                <TableCell>
                                    <form action={deleteCrop.bind(null, crop.id)}>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                                            <Trash2 className="h-4 w-4" />
                                            <span className="sr-only">Delete</span>
                                        </Button>
                                    </form>
                                </TableCell>
                            </TableRow>
                        ))}
                         {(!crops || crops.length === 0) && (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center text-muted-foreground">
                                    No crops added yet.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Add Crop Form */}
            <div className="border-t pt-6">
               <h3 className="mb-4 text-lg font-medium">Add New Crop</h3>
               <form action={addCrop} className="grid gap-4 md:grid-cols-5 items-end">
                <div className="grid gap-2 md:col-span-2">
                    <Label htmlFor="crop-name">Name</Label>
                    <Input id="crop-name" name="name" placeholder="e.g. Paddy" required />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="weight">Weight (kg)</Label>
                    <Input id="weight" name="weight" type="number" step="0.01" placeholder="75" required />
                </div>
                 <div className="grid gap-2">
                    <Label htmlFor="price6m">Rent (6M)</Label>
                    <Input id="price6m" name="price6m" type="number" step="0.01" placeholder="30" required />
                </div>
                 <div className="grid gap-2">
                    <Label htmlFor="price1y">Rent (1Y)</Label>
                    <Input id="price1y" name="price1y" type="number" step="0.01" placeholder="50" required />
                </div>
                <div className="md:col-span-5">
                    <Button type="submit" variant="secondary" className="w-full md:w-auto">Add Crop</Button>
                </div>
               </form>
            </div>

          </CardContent>
        </Card>
      </div>
    </div>
    </AppLayout>
  );
}
