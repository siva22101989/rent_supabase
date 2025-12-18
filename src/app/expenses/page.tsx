

import { AppLayout } from "@/components/layout/app-layout";
import { PageHeader } from "@/components/shared/page-header";
import { AddExpenseDialog } from "@/components/expenses/add-expense-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Scale } from "lucide-react";
import { getStorageRecords, getExpenses } from "@/lib/queries";
import { formatCurrency, toDate } from "@/lib/utils";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { Expense, StorageRecord } from "@/lib/definitions";
import { format } from "date-fns";
import { ExpenseActionsMenu } from "@/components/expenses/expense-actions-menu";

export const dynamic = 'force-dynamic';

export default async function ExpensesPage() {
  const [allRecords, allExpenses] = await Promise.all([
     getStorageRecords(),
     getExpenses()
  ]);

    const income = allRecords.reduce((total, record) => {
      const rentPayments = (record.payments || [])
        // All payments attached to storage records are considered Income (Rent + Hamali)
        .reduce((acc: any, p: any) => acc + p.amount, 0);
      return total + rentPayments;
    }, 0);

    const expensesTotal = allExpenses.reduce((total, expense) => total + expense.amount, 0);

    const totalIncome = income;
    const totalExpenses = expensesTotal;
    const totalBalance = income - expensesTotal;

  return (
    <AppLayout>
      <PageHeader
        title="Expenses & Income"
        description="Track your warehouse operational finances."
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
      <div className="mt-8">
        <Card>
            <CardHeader>
                <CardTitle>Expense History</CardTitle>
            </CardHeader>
            <CardContent>
                <Table>
                <TableHeader>
                    <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {allExpenses.map((expense) => (
                    <TableRow key={expense.id}>
                        <TableCell>{format(toDate(expense.date), 'dd MMM yyyy')}</TableCell>
                        <TableCell>{expense.category}</TableCell>
                        <TableCell className="font-medium">{expense.description}</TableCell>
                        <TableCell className="text-right font-mono">{formatCurrency(expense.amount)}</TableCell>
                        <TableCell>
                        <ExpenseActionsMenu expense={expense} />
                        </TableCell>
                    </TableRow>
                    ))}
                    {allExpenses.length === 0 && (
                        <TableRow>
                            <TableCell colSpan={5} className="text-center text-muted-foreground p-6">
                                No expenses have been recorded yet.
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
