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
import { FilterPopover, FilterSection, MultiSelect, NumberRangeInput, SortDropdown, ShareFilterButton, type MultiSelectOption, type SortOption } from '@/components/filters';
import { useUrlFilters } from '@/hooks/use-url-filters';

interface OutflowFilterState {
  search: string;
  dateRange: DateRange | undefined;
  selectedCommodities: string[];
  minBags: number | null;
  maxBags: number | null;
  sortBy: string;
}

interface OutflowListClientProps {
    outflows: any[];
}

export function OutflowListClient({ outflows }: OutflowListClientProps) {
    const [filters, setFilters] = useUrlFilters<OutflowFilterState>({
        search: '',
        dateRange: undefined as DateRange | undefined,
        selectedCommodities: [] as string[],
        minBags: null as number | null,
        maxBags: null as number | null,
        sortBy: 'date-desc'
    });
    
    const searchTerm = filters.search;
    const dateRange = filters.dateRange;
    const selectedCommodities = filters.selectedCommodities;
    const minBags = filters.minBags;
    const maxBags = filters.maxBags;
    const sortBy = filters.sortBy;

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

        // Commodity filter
        if (selectedCommodities.length > 0) {
            result = result.filter(o => selectedCommodities.includes(o.commodity));
        }

        // Bags range filter
        if (minBags !== null) result = result.filter(o => o.bags >= minBags);
        if (maxBags !== null) result = result.filter(o => o.bags <= maxBags);

        // Sort
        result.sort((a, b) => {
            switch (sortBy) {
                case 'date-desc':
                    return new Date(b.date).getTime() - new Date(a.date).getTime();
                case 'date-asc':
                    return new Date(a.date).getTime() - new Date(b.date).getTime();
                case 'bags-desc':
                    return b.bags - a.bags;
                case 'bags-asc':
                    return a.bags - b.bags;
                case 'customer-asc':
                    return (a.customerName || '').localeCompare(b.customerName || '');
                case 'customer-desc':
                    return (b.customerName || '').localeCompare(a.customerName || '');
                default:
                    return 0;
            }
        });

        return result;
    }, [outflows, searchTerm, dateRange, selectedCommodities, minBags, maxBags, sortBy]);

    // Prepare filter options
    const commodityOptions: MultiSelectOption[] = useMemo(() => {
        const unique = Array.from(new Set(outflows.map(o => o.commodity)));
        return unique.map(name => ({ label: name, value: name }));
    }, [outflows]);

    const sortOptions: SortOption[] = [
        { label: 'Newest First', value: 'date-desc', icon: 'desc' },
        { label: 'Oldest First', value: 'date-asc', icon: 'asc' },
        { label: 'Most Bags', value: 'bags-desc', icon: 'desc' },
        { label: 'Least Bags', value: 'bags-asc', icon: 'asc' },
        { label: 'Customer (A-Z)', value: 'customer-asc', icon: 'asc' },
        { label: 'Customer (Z-A)', value: 'customer-desc', icon: 'desc' },
    ];

    const activeFilters = useMemo(() => {
        let count = 0;
        if (dateRange?.from) count++;
        if (selectedCommodities.length > 0) count++;
        if (minBags !== null || maxBags !== null) count++;
        return count;
    }, [dateRange, selectedCommodities, minBags, maxBags]);

    const handleClearFilters = () => {
        setFilters(prev => ({
            ...prev,
            dateRange: undefined,
            selectedCommodities: [],
            minBags: null,
            maxBags: null
        }));
    };

    return (
        <div className="mt-8">
            <h3 className="text-lg font-medium mb-4">Recent Withdrawals</h3>

            {/* Search and Filter Controls */}
            <div className="flex flex-col sm:flex-row gap-3 mb-4">
                <SearchBar
                    value={searchTerm}
                    onChange={(value) => setFilters(prev => ({ ...prev, search: value }))}
                    placeholder="Search by customer, invoice, or commodity..."
                    className="flex-1"
                />
                <DatePickerWithRange date={dateRange} setDate={(range) => setFilters(prev => ({ ...prev, dateRange: range }))} className="w-full sm:w-auto" />
                <FilterPopover
                    activeFilters={activeFilters}
                    onClear={handleClearFilters}
                >
                    <FilterSection title="Commodities">
                        <MultiSelect
                            options={commodityOptions}
                            selected={selectedCommodities}
                            onChange={(value) => setFilters(prev => ({ ...prev, selectedCommodities: value }))}
                            placeholder="All commodities"
                        />
                    </FilterSection>
                    <FilterSection title="Bags Range">
                        <NumberRangeInput
                            min={minBags}
                            max={maxBags}
                            onMinChange={(value) => setFilters(prev => ({ ...prev, minBags: value }))}
                            onMaxChange={(value) => setFilters(prev => ({ ...prev, maxBags: value }))}
                            minPlaceholder="Min bags"
                            maxPlaceholder="Max bags"
                        />
                    </FilterSection>
                </FilterPopover>
                <SortDropdown
                    options={sortOptions}
                    value={sortBy}
                    onChange={(value) => setFilters(prev => ({ ...prev, sortBy: value }))}
                />
                <ShareFilterButton filters={filters} />
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
