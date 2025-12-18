import { AppLayout } from "@/components/layout/app-layout";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowDown, ArrowUp, Warehouse, IndianRupee } from "lucide-react";
import { calculateFinalRent } from "@/lib/billing";
import { formatCurrency } from "@/lib/utils";
import { getStorageRecords } from "@/lib/queries";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export const dynamic = 'force-dynamic';

export default async function StoragePage() {
  const allRecords = await getStorageRecords();

  const totalInflow = allRecords.reduce((acc, record) => acc + record.bagsStored, 0);
  
  const completedRecords = allRecords.filter(r => r.storageEndDate);
  const totalOutflow = completedRecords.reduce((acc, record) => acc + record.bagsStored, 0);

  const balanceStock = totalInflow - totalOutflow;

  const activeRecords = allRecords.filter(r => !r.storageEndDate);
  const estimatedRent = activeRecords.reduce((total, record) => {
    // Note: This logic assumes 'new Date()' is the target date. 
    // In a real SC, 'new Date()' is server time.
    const { rent } = calculateFinalRent(record, new Date(), record.bagsStored);
    return total + rent;
  }, 0);

  const stats = { totalInflow, totalOutflow, balanceStock, estimatedRent };

  return (
    <AppLayout>
      <PageHeader
        title="Storage Overview"
        description="A high-level summary of your warehouse inventory."
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Inflow</CardTitle>
                <ArrowDown className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{stats.totalInflow} bags</div>
            </CardContent>
        </Card>
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Outflow</CardTitle>
                <ArrowUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{stats.totalOutflow} bags</div>
            </CardContent>
        </Card>
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Balance Stock</CardTitle>
                <Warehouse className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{stats.balanceStock} bags</div>
            </CardContent>
        </Card>
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Estimated Rent Due</CardTitle>
                <IndianRupee className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(stats.estimatedRent)}</div>
                <p className="text-xs text-muted-foreground">
                    Based on current active stock
                </p>
            </CardContent>
        </Card>
      </div>

      {/* Detailed Stock Register */}
      <div>
        <h3 className="text-lg font-medium mb-4">Detailed Stock Register (Active)</h3>
        <Card>
            <CardContent className="p-0">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Date In</TableHead>
                            <TableHead>ID</TableHead>
                            <TableHead>Location</TableHead>
                            <TableHead>Commodity</TableHead>
                            <TableHead className="text-right">Bags</TableHead>
                            <TableHead className="text-right">Rent Due</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {activeRecords
                            .sort((a, b) => new Date(b.storageStartDate).getTime() - new Date(a.storageStartDate).getTime())
                            .map((record) => {
                                // Recalculate rent for each row to show current liability
                                const { rent } = calculateFinalRent(record, new Date(), record.bagsStored);
                                return (
                                    <TableRow key={record.id}>
                                        <TableCell>{new Date(record.storageStartDate).toLocaleDateString()}</TableCell>
                                        <TableCell className="font-medium">{record.id}</TableCell>
                                        <TableCell><span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80">{record.location}</span></TableCell>
                                        <TableCell>{record.commodityDescription}</TableCell>
                                        <TableCell className="text-right font-medium">{record.bagsStored}</TableCell>
                                        <TableCell className="text-right text-muted-foreground">{formatCurrency(rent)}</TableCell>
                                    </TableRow>
                                );
                            })}
                        {activeRecords.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                                    No active stock found in the warehouse.
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
