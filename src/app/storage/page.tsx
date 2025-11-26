
import { AppLayout } from "@/components/layout/app-layout";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowDown, ArrowUp, Warehouse, IndianRupee } from "lucide-react";
import { storageRecords as getStorageRecords } from "@/lib/data";
import { calculateFinalRent } from "@/lib/billing";
import { formatCurrency } from "@/lib/utils";

export default async function StoragePage() {
  const allRecords = await getStorageRecords();

  const totalInflow = allRecords.reduce((acc, record) => acc + record.bagsStored, 0);

  const completedRecords = allRecords.filter(r => r.storageEndDate);
  const totalOutflow = allRecords.reduce((acc, record) => acc + record.bagsStored, 0);

  const balanceStock = totalInflow - totalOutflow;

  const activeRecords = allRecords.filter(r => !r.storageEndDate);
  const estimatedRent = activeRecords.reduce((total, record) => {
    const { rent } = calculateFinalRent(record, new Date(), record.bagsStored);
    return total + rent;
  }, 0);


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
                <div className="text-2xl font-bold">{totalInflow} bags</div>
            </CardContent>
        </Card>
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Outflow</CardTitle>
                <ArrowUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{totalOutflow} bags</div>
            </CardContent>
        </Card>
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Balance Stock</CardTitle>
                <Warehouse className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{balanceStock} bags</div>
            </CardContent>
        </Card>
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Estimated Rent Due</CardTitle>
                <IndianRupee className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(estimatedRent)}</div>
                <p className="text-xs text-muted-foreground">
                    Based on current active stock
                </p>
            </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
