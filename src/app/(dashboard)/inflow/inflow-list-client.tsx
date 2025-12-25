'use client';

import { useState, useMemo } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState } from "@/components/ui/empty-state";
import { ArrowDownToDot } from "lucide-react";
import { MobileCard } from "@/components/ui/mobile-card";
import { SearchBar } from "@/components/ui/search-bar";
import { DatePickerWithRange } from "@/components/ui/date-range-picker";
import { DateRange } from "react-day-picker";
import { startOfDay, endOfDay, isWithinInterval } from "date-fns";

interface InflowListClientProps {
    inflows: any[];
}

export function InflowListClient({ inflows }: InflowListClientProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const [dateRange, setDateRange] = useState<DateRange | undefined>();

    const filteredInflows = useMemo(() => {
        let result = [...inflows];

        // Search filter
        if (searchTerm) {
            const search = searchTerm.toLowerCase();
            result = result.filter(i =>
                i.customerName?.toLowerCase().includes(search) ||
                i.commodity?.toLowerCase().includes(search) ||
                i.id?.toLowerCase().includes(search)
            );
        }

        // Date filter
        if (dateRange?.from) {
            result = result.filter(i => {
                const date = new Date(i.date);
                return isWithinInterval(date, {
                    start: startOfDay(dateRange.from!),
                    end: dateRange.to ? endOfDay(dateRange.to) : endOfDay(dateRange.from!)
                });
            });
        }

        return result;
    }, [inflows, searchTerm, dateRange]);

    return (
        <div className="mt-8">
            <h3 className="text-lg font-medium mb-4">Recent Inflows</h3>

            {/* Search and Filter Controls */}
            <div className="flex flex-col sm:flex-row gap-3 mb-4">
                <SearchBar
                    value={searchTerm}
                    onChange={setSearchTerm}
                    placeholder="Search by customer or commodity..."
                    className="flex-1"
                />
                <DatePickerWithRange date={dateRange} setDate={setDateRange} className="w-full sm:w-auto" />
            </div>

            {/* Mobile View */}
            <div className="md:hidden space-y-4">
                {filteredInflows.map((record) => (
                    <MobileCard key={record.id}>
                        <MobileCard.Header>
                            <div className="flex-1">
                                <MobileCard.Title>{record.customerName}</MobileCard.Title>
                                <p className="text-xs text-muted-foreground mt-1">
                                    {record.date.toLocaleDateString()} • Inflow #{record.id}
                                </p>
                            </div>
                            <MobileCard.Badge>{record.bags} Bags</MobileCard.Badge>
                        </MobileCard.Header>
                        <MobileCard.Content>
                            <p className="text-sm">{record.commodity}</p>
                        </MobileCard.Content>
                    </MobileCard>
                ))}
                {filteredInflows.length === 0 && (
                    <EmptyState
                        icon={ArrowDownToDot}
                        title={searchTerm || dateRange ? "No inflows found" : "No inflows yet"}
                        description={searchTerm || dateRange ? "Try adjusting your search or date range." : "Your recent inflows will appear here once you add your first storage record using the form above."}
                    />
                )}
            </div>

            {/* Desktop View */}
            <div className="rounded-md border bg-card hidden md:block">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Date In</TableHead>
                            <TableHead>ID</TableHead>
                            <TableHead>Customer</TableHead>
                            <TableHead>Item</TableHead>
                            <TableHead className="text-right">Bags</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredInflows.map((record) => {
                            return (
                                <TableRow key={record.id}>
                                    <TableCell>{record.date.toLocaleDateString()}</TableCell>
                                    <TableCell className="font-medium font-mono">{record.id}</TableCell>
                                    <TableCell>{record.customerName}</TableCell>
                                    <TableCell>{record.commodity}</TableCell>
                                    <TableCell className="text-right">{record.bags}</TableCell>
                                </TableRow>
                            );
                        })}
                        {filteredInflows.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={5} className="h-48">
                                    <EmptyState
                                        icon={ArrowDownToDot}
                                        title={searchTerm || dateRange ? "No inflows found" : "No inflows yet"}
                                        description={searchTerm || dateRange ? "Try adjusting your search or date range." : "Your recent inflows will appear here once you add your first storage record using the form above."}
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
