
import { AppLayout } from "@/components/layout/app-layout";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PlusCircle, IndianRupee, TrendingUp, TrendingDown } from "lucide-react";
import { storageRecords as getStorageRecords } from "@/lib/data";

function formatCurrency(amount: number) {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 2,
    }).format(amount);
}

export default async function ExpensesPage() {
  const allRecords = await getStorageRecords();
  
  const totalIncome = allRecords.reduce((total, record) => {
      const recordPayments = (record.payments || []).reduce((acc, p) => acc + p.amount, 0);
      return total + recordPayments;
  }, 0);

  return (
    <AppLayout>
      <PageHeader
        title="Expenses & Income"
        description="Track your warehouse operational finances."
      >
        <Button>
          <PlusCircle className="mr-2" />
          Add Expense
        </Button>
      </PageHeader>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Income</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground text-green-500" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold text-green-600">{formatCurrency(totalIncome)}</div>
                <p className="text-xs text-muted-foreground">
                    Total amount received from all payments.
                </p>
            </CardContent>
        </Card>
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
                 <TrendingDown className="h-4 w-4 text-muted-foreground text-red-500" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold text-destructive">{formatCurrency(0)}</div>
                 <p className="text-xs text-muted-foreground">
                    Expense tracking is coming soon.
                </p>
            </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Expense Tracking Coming Soon</CardTitle>
        </CardHeader>
        <CardContent>
          <p>The full expense tracking feature is currently under development. Please check back later!</p>
        </CardContent>
      </Card>
    </AppLayout>
  );
}
