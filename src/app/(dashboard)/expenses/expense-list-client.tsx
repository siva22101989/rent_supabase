'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { MobileCard } from "@/components/ui/mobile-card";
import { EmptyState } from "@/components/ui/empty-state";
import { Wallet } from "lucide-react";
import { ExpenseActionsMenu } from "@/components/expenses/expense-actions-menu";
import { SearchBar } from "@/components/ui/search-bar";
import { DatePickerWithRange } from "@/components/ui/date-range-picker";
import { DateRange } from "react-day-picker";
import { format, startOfDay, endOfDay, isWithinInterval } from "date-fns";
import { formatCurrency, toDate } from "@/lib/utils";
import type { Expense } from "@/lib/definitions";

interface ExpenseListClientProps {
    expenses: Expense[];
}

export function ExpenseListClient({ expenses }: ExpenseListClientProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const [dateRange, setDateRange] = useState<DateRange | undefined>();

    const filteredExpenses = useMemo(() => {
        let result = [...expenses];

        // Search filter
        if (searchTerm) {
            const search = searchTerm.toLowerCase();
            result = result.filter(e =>
                e.description?.toLowerCase().includes(search) ||
                e.category?.toLowerCase().includes(search)
            );
        }

        // Date filter
        if (dateRange?.from) {
            result = result.filter(e => {
                const date = toDate(e.date);
                return isWithinInterval(date, {
                    start: startOfDay(dateRange.from!),
                    end: dateRange.to ? endOfDay(dateRange.to) : endOfDay(dateRange.from!)
                });
            });
        }

        return result;
    }, [expenses, searchTerm, dateRange]);

    return (
        <div className="mt-6">
            <Card>
                <CardHeader>
                    <CardTitle>Expense History</CardTitle>
                </CardHeader>
                <CardContent>
                    {/* Search and Filter Controls */}
                    <div className="flex flex-col sm:flex-row gap-3 mb-4">
                        <SearchBar
                            value={searchTerm}
                            onChange={setSearchTerm}
                            placeholder="Search by description or category..."
                            className="flex-1"
                        />
                        <DatePickerWithRange date={dateRange} setDate={setDateRange} className="w-full sm:w-auto" />
                    </div>

                    {/* Mobile View */}
                    <div className="md:hidden space-y-4">
                        {filteredExpenses.map((expense) => (
                            <MobileCard key={expense.id}>
                                <MobileCard.Header>
                                    <div className="flex-1">
                                        <MobileCard.Title>{expense.category}</MobileCard.Title>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            {format(toDate(expense.date), 'dd MMM yyyy')}
                                        </p>
                                    </div>
                                    <MobileCard.Badge>{formatCurrency(expense.amount)}</MobileCard.Badge>
                                </MobileCard.Header>
                                <MobileCard.Content>
                                    <p className="text-sm font-medium">{expense.description}</p>
                                </MobileCard.Content>
                                <MobileCard.Actions>
                                    <div className="w-full flex justify-end">
                                        <ExpenseActionsMenu expense={expense} />
                                    </div>
                                </MobileCard.Actions>
                            </MobileCard>
                        ))}
                        {filteredExpenses.length === 0 && (
                            <EmptyState
                                icon={Wallet}
                                title={searchTerm || dateRange ? "No expenses found" : "No expenses recorded"}
                                description={searchTerm || dateRange ? "Try adjusting your search or date range." : "Your expense history will appear here."}
                            />
                        )}
                    </div>

                    {/* Desktop View */}
                    <Table className="hidden md:table">
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
                            {filteredExpenses.map((expense) => (
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
                            {filteredExpenses.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center text-muted-foreground p-6">
                                        {searchTerm || dateRange ? "No expenses found matching your criteria." : "No expenses have been recorded yet."}
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
