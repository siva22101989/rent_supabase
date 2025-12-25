'use client';

import { useState, useMemo } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState } from "@/components/ui/empty-state";
import { ArrowUpFromDot } from "lucide-react";
import { MobileCard } from "@/components/ui/mobile-card";
import { DeleteOutflowButton } from "@/components/outflow/delete-outflow-button";
import { EditOutflowDialog } from "@/components/outflow/edit-outflow-dialog";
import { SearchBar } from "@/components/ui/search-bar";
import { DatePickerWithRange } from "@/components/ui/date-range-picker";
import { DateRange } from "react-day-picker";
import { startOfDay, endOfDay, isWithinInterval } from "date-fns";

interface OutflowListClientProps {
    outflows: any[];
}

export function OutflowListClient({ outflows }: OutflowListClientProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const [dateRange, setDateRange] = useState<DateRange | undefined>();

    const filteredOutflows = useMemo(() => {
        let result = [...outflows];

        // Search filter
        if (searchTerm) {
            const search = searchTerm.toLowerCase();
            result = result.filter(o =>
                o.customerName?.toLowerCase().includes(search) ||
                o.invoiceNo?.toLowerCase().includes(search) ||
                o.commodity?.toLowerCase().includes(search)
            );
        }

        // Date filter
        if (dateRange?.from) {
            result = result.filter(o => {
                const date = new Date(o.date);
                return isWithinInterval(date, {
                    start: startOfDay(dateRange.from!),
                    end: dateRange.to ? endOfDay(dateRange.to) : endOfDay(dateRange.from!)
                });
            });
        }

        return result;
    }, [outflows, searchTerm, dateRange]);

    return (
        <div className="mt-8">
            <h3 className="text-lg font-medium mb-4">Recent Withdrawals</h3>

            {/* Search and Filter Controls */}
            <div className="flex flex-col sm:flex-row gap-3 mb-4">
                <SearchBar
                    value={searchTerm}
                    onChange={setSearchTerm}
                    placeholder="Search by customer, invoice, or commodity..."
                    className="flex-1"
                />
                <DatePickerWithRange date={dateRange} setDate={setDateRange} className="w-full sm:w-auto" />
            </div>

            {/* Mobile View */}
            <div className="md:hidden space-y-4">
                {filteredOutflows.map((record) => (
                    <MobileCard key={record.id}>
                        <MobileCard.Header>
                            <div className="flex-1">
                                <MobileCard.Title>{record.customerName}</MobileCard.Title>
                                <p className="text-xs text-muted-foreground mt-1">
                                    {record.date.toLocaleDateString()} • Inv #{record.invoiceNo}
                                </p>
                            </div>
                            <MobileCard.Badge variant="destructive">-{record.bags} Bags</MobileCard.Badge>
                        </MobileCard.Header>
                        <MobileCard.Content>
                            <MobileCard.Row label="Item" value={record.commodity} />
                        </MobileCard.Content>
                        <MobileCard.Actions>
                            <div className="w-full flex justify-end gap-2">
                                <EditOutflowDialog transaction={record} />
                                <DeleteOutflowButton
                                    transactionId={record.id}
                                    bags={record.bags}
                                    rentCollected={record.rentCollected || 0}
                                />
                            </div>
                        </MobileCard.Actions>
                    </MobileCard>
                ))}
                {filteredOutflows.length === 0 && (
                    <EmptyState
                        icon={ArrowUpFromDot}
                        title={searchTerm || dateRange ? "No withdrawals found" : "No withdrawals yet"}
                        description={searchTerm || dateRange ? "Try adjusting your search or date range." : "Your recent withdrawals will appear here once you process your first outflow using the form above."}
                    />
                )}
            </div>

            {/* Desktop View */}
            <div className="rounded-md border bg-card hidden md:block">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Date Out</TableHead>
                            <TableHead>ID</TableHead>
                            <TableHead>Customer</TableHead>
                            <TableHead>Item</TableHead>
                            <TableHead className="text-right">Bags</TableHead>
                            <TableHead className="w-[100px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredOutflows.map((record) => {
                            return (
                                <TableRow key={record.id}>
                                    <TableCell>{record.date.toLocaleDateString()}</TableCell>
                                    <TableCell className="font-medium font-mono">{record.invoiceNo}</TableCell>
                                    <TableCell>{record.customerName}</TableCell>
                                    <TableCell>{record.commodity}</TableCell>
                                    <TableCell className="text-right">{record.bags}</TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex items-center justify-end gap-1">
                                            <EditOutflowDialog transaction={record} />
                                            <DeleteOutflowButton
                                                transactionId={record.id}
                                                bags={record.bags}
                                                rentCollected={record.rentCollected || 0}
                                            />
                                        </div>
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                        {filteredOutflows.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={6} className="h-48">
                                    <EmptyState
                                        icon={ArrowUpFromDot}
                                        title={searchTerm || dateRange ? "No withdrawals found" : "No withdrawals yet"}
                                        description={searchTerm || dateRange ? "Try adjusting your search or date range." : "Your recent withdrawals will appear here once you process your first outflow using the form above."}
                                    />
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
