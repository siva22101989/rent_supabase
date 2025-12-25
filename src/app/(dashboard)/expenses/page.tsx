
import { PageHeader } from "@/components/shared/page-header";
import { AddExpenseDialog } from "@/components/expenses/add-expense-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Scale } from "lucide-react";
import { getFinancialStats, getExpenses } from "@/lib/queries";
import { formatCurrency } from "@/lib/utils";
import { ExpenseListClient } from "./expense-list-client";

export const dynamic = 'force-dynamic';

export default async function ExpensesPage() {
  const [financials, allExpenses] = await Promise.all([
     getFinancialStats(),
     getExpenses(100) // Fetch more for filtering
  ]);

  const { totalIncome, totalExpenses, totalBalance } = financials;

  return (
    <>
      <PageHeader
        title="Expenses & Income"
        description="Track your warehouse operational finances."
        breadcrumbs={[
          { label: 'Dashboard', href: '/' },
          { label: 'Expenses' }
        ]}
      >
        <AddExpenseDialog />
      </PageHeader>

      <div className="grid gap-6 md:grid-cols-3">
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
                <div className="text-2xl font-bold text-destructive">{formatCurrency(totalExpenses)}</div>
                 <p className="text-xs text-muted-foreground">
                    Sum of all recorded operational expenses.
                </p>
            </CardContent>
        </Card>
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Balance</CardTitle>
                 <Scale className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className={`text-2xl font-bold ${totalBalance >= 0 ? 'text-primary' : 'text-destructive'}`}>{formatCurrency(totalBalance)}</div>
                 <p className="text-xs text-muted-foreground">
                    Net balance after all income and expenses.
                </p>
            </CardContent>
        </Card>
      </div>

      {/* Expense History with Search/Filter */}
      <ExpenseListClient expenses={allExpenses} />
    </>
  );
}
