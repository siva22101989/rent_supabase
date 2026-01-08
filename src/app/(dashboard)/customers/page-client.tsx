'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { PageHeader } from "@/components/shared/page-header";
import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { AddCustomerDialog } from "@/components/customers/add-customer-dialog";
import { formatCurrency } from "@/lib/utils";
import { Pagination } from "@/components/ui/pagination";
import { Input } from "@/components/ui/input";
import { Search, Users, Phone, MapPin } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { MobileCard } from "@/components/ui/mobile-card";
import { useDebounce } from "@uidotdev/usehooks";
import { FilterPopover, FilterSection, MultiSelect, NumberRangeInput, SortDropdown, ShareFilterButton, ExportButton, type MultiSelectOption, type SortOption } from '@/components/filters';
import { exportCustomersWithFilters } from "@/lib/export-utils-filtered";
import { getAppliedFiltersSummary } from "@/lib/url-filters";
import { useUrlFilters } from '@/hooks/use-url-filters';

interface CustomerFilterState {
  search: string;
  selectedVillages: string[];
  minBalance: number | null;
  maxBalance: number | null;
  sortBy: string;
}

const ITEMS_PER_PAGE = 20;

export function CustomersPageClient({ 
  initialCustomers
}: { 
  initialCustomers: any[], 
}) {
  // Use initial data plus client-side search/sort if needed.
  // Ideally, search should be server-side now.
  // For Phase 5 completeness, we'll implement simple client-side search on the loaded 50 records,
  // but true scalability requires wiring the search input to the URL params.
  
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // URL-synchronized filter state
  const [filters, setFilters] = useUrlFilters<CustomerFilterState>({
    search: searchParams.get('q') || '',
    selectedVillages: [] as string[],
    minBalance: null as number | null,
    maxBalance: null as number | null,
    sortBy: 'balance-desc'
  });
  
  const searchTerm = filters.search;
  const selectedVillages = filters.selectedVillages;
  const minBalance = filters.minBalance;
  const maxBalance = filters.maxBalance;
  const sortBy = filters.sortBy;
  
  const debouncedSearch = useDebounce(searchTerm, 500);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasActiveRecords, setHasActiveRecords] = useState<boolean | null>(null);

  // Track previous search to detect actual changes (useRef persists across renders)
  const prevSearchRef = useRef(searchParams.get('search') || '');

  // Update URL when debounced search changes
  useEffect(() => {
     const params = new URLSearchParams(searchParams);
     if (debouncedSearch) {
         params.set('search', debouncedSearch);
     } else {
         params.delete('search');
     }
     // Only reset pagination when search actually changes from user input
     if (debouncedSearch !== prevSearchRef.current) {
        setCurrentPage(1);
        prevSearchRef.current = debouncedSearch; // Update ref
     }
     router.replace(`/customers?${params.toString()}`);
  }, [debouncedSearch, router, searchParams]);

  const handleSearch = (value: string) => {
    setFilters(prev => ({ ...prev, search: value }));
  };
  
  // Since we are filtering on the server, we just display what's passed in
  // No need for client-side filtering logic
  const paginatedCustomers = initialCustomers; // Server limit is applied

  // Client-side filtering and sorting
  const filteredCustomers = useMemo(() => {
    let result = [...paginatedCustomers];

    // Village filter
    if (selectedVillages.length > 0) {
      result = result.filter(c => c.village && selectedVillages.includes(c.village));
    }

    // Balance range filter
    if (minBalance !== null) result = result.filter(c => c.balance >= minBalance);
    if (maxBalance !== null) result = result.filter(c => c.balance <= maxBalance);

    // Active records filter
    if (hasActiveRecords !== null) {
      result = result.filter(c => hasActiveRecords ? c.activeRecords > 0 : c.activeRecords === 0);
    }

    // Sort
    result.sort((a, b) => {
      switch (sortBy) {
        case 'name-asc':
          return a.name.localeCompare(b.name);
        case 'name-desc':
          return b.name.localeCompare(a.name);
        case 'balance-desc':
          return b.balance - a.balance;
        case 'balance-asc':
          return a.balance - b.balance;
        case 'billed-desc':
          return b.totalBilled - a.totalBilled;
        case 'billed-asc':
          return a.totalBilled - b.totalBilled;
        case 'records-desc':
          return b.activeRecords - a.activeRecords;
        case 'records-asc':
          return a.activeRecords - b.activeRecords;
        default:
          return 0;
      }
    });

    return result;
  }, [paginatedCustomers, selectedVillages, minBalance, maxBalance, hasActiveRecords, sortBy]);

  // Prepare filter options
  const villageOptions: MultiSelectOption[] = useMemo(() => {
    const unique = Array.from(new Set(initialCustomers.map(c => c.village).filter(Boolean)));
    return unique.map(name => ({ label: name, value: name }));
  }, [initialCustomers]);

  const sortOptions: SortOption[] = [
    { label: 'Highest Balance', value: 'balance-desc', icon: 'desc' },
    { label: 'Lowest Balance', value: 'balance-asc', icon: 'asc' },
    { label: 'Name (A-Z)', value: 'name-asc', icon: 'asc' },
    { label: 'Name (Z-A)', value: 'name-desc', icon: 'desc' },
    { label: 'Most Billed', value: 'billed-desc', icon: 'desc' },
    { label: 'Least Billed', value: 'billed-asc', icon: 'asc' },
    { label: 'Most Active Records', value: 'records-desc', icon: 'desc' },
    { label: 'Least Active Records', value: 'records-asc', icon: 'asc' },
  ];

  const activeFilters = useMemo(() => {
    let count = 0;
    if (selectedVillages.length > 0) count++;
    if (minBalance !== null || maxBalance !== null) count++;
    if (hasActiveRecords !== null) count++;
    return count;
  }, [selectedVillages, minBalance, maxBalance, hasActiveRecords]);

  const handleClearFilters = () => {
    setFilters(prev => ({
      ...prev,
      selectedVillages: [],
      minBalance: null,
      maxBalance: null
    }));
    setHasActiveRecords(null);
  };

  const handleExportExcel = () => {
    const metadata = {
        totalRecords: initialCustomers.length,
        filteredRecords: filteredCustomers.length,
        appliedFilters: getAppliedFiltersSummary(filters),
        exportDate: new Date()
    };
    exportCustomersWithFilters(filteredCustomers, metadata);
  };

  return (
    <>
      <PageHeader
        title="Customers"
        description="Manage your customers and view their financial status."
        breadcrumbs={[
          { label: 'Dashboard', href: '/' },
          { label: 'Customers' }
        ]}
      >
        <div data-add-customer-trigger>
          <AddCustomerDialog />
        </div>
      </PageHeader>
      
      <div className="mb-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search all customers (Server-Side)..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <FilterPopover
            activeFilters={activeFilters}
            onClear={handleClearFilters}
          >
            <FilterSection title="Villages">
              <MultiSelect
                options={villageOptions}
                selected={selectedVillages}
                onChange={(value) => setFilters(prev => ({ ...prev, selectedVillages: value }))}
                placeholder="All villages"
              />
            </FilterSection>
            <FilterSection title="Balance Range">
              <NumberRangeInput
                min={minBalance}
                max={maxBalance}
                onMinChange={(value) => setFilters(prev => ({ ...prev, minBalance: value }))}
                onMaxChange={(value) => setFilters(prev => ({ ...prev, maxBalance: value }))}
                minPlaceholder="Min balance"
                maxPlaceholder="Max balance"
              />
            </FilterSection>
          </FilterPopover>
          <SortDropdown
            options={sortOptions}
            value={sortBy}
            onChange={(value) => setFilters(prev => ({ ...prev, sortBy: value }))}
          />
          <ShareFilterButton filters={filters} />
          <div className="hidden sm:block">
             <ExportButton 
                 onExportExcel={handleExportExcel}
                 label="Export"
             />
          </div>
        </div>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-4">
        {filteredCustomers.length === 0 ? (
          <EmptyState
            icon={Users}
            title={searchTerm ? "No customers found" : "No customers yet"}
            description={searchTerm ? `No customers match "${searchTerm}".` : "Add your first customer to start tracking storage and payments."}
            actionLabel={searchTerm ? undefined : "Add First Customer"}
            onAction={searchTerm ? undefined : () => document.querySelector<HTMLButtonElement>('[data-add-Customer-trigger]')?.click()}
          />
        ) : (
          paginatedCustomers.map((customer) => (
            <Link key={customer.id} href={`/customers/${customer.id}`} className="block">
              <MobileCard className="hover:border-primary/50 transition-colors">
                <MobileCard.Header>
                  <div className="flex-1">
                    <MobileCard.Title>{customer.name}</MobileCard.Title>
                    <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {customer.phone || '-'}
                      </span>
                      {customer.village && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {customer.village}
                        </span>
                      )}
                    </div>
                  </div>
                </MobileCard.Header>
                <MobileCard.Content>
                  <MobileCard.Row 
                    label="Active Bags" 
                    value={customer.activeRecords > 0 ? <span className="text-green-600 font-semibold">{customer.activeRecords} (Records)</span> : <span className="text-muted-foreground">-</span>}
                  />
                  <MobileCard.Row 
                    label="Balance Due" 
                    value={customer.balance > 0 ? <span className="text-destructive font-bold">{formatCurrency(customer.balance)}</span> : <span className="text-muted-foreground">-</span>}
                  />
                </MobileCard.Content>
              </MobileCard>
            </Link>
          ))
        )}
      </div>

      {/* Desktop Table View */}
      <Card className="hidden md:block">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Village</TableHead>
                <TableHead className="text-right">Active Records</TableHead>
                <TableHead className="text-right">Total Billed</TableHead>
                <TableHead className="text-right">Paid</TableHead>
                <TableHead className="text-right">Balance Due</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCustomers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-64">
                    <EmptyState
                      icon={Users}
                      title={searchTerm ? "No customers found" : "No customers yet"}
                      description={searchTerm ? `No customers match "${searchTerm}".` : "Add your first customer to start tracking storage and payments."}
                      actionLabel={searchTerm ? undefined : "Add First Customer"}
                      onAction={searchTerm ? undefined : () => document.querySelector<HTMLButtonElement>('[data-add-customer-trigger]')?.click()}
                    />
                  </TableCell>
                </TableRow>
              ) : (
                filteredCustomers.map((customer) => (
                  <TableRow key={customer.id}>
                    <TableCell className="font-medium">
                      <Link href={`/customers/${customer.id}`} className="hover:underline">
                        <div className="text-base font-semibold text-primary">{customer.name}</div>
                      </Link>
                      <div className="text-xs text-muted-foreground">{customer.email || '-'}</div>
                    </TableCell>
                    <TableCell>{customer.phone || '-'}</TableCell>
                    <TableCell>{customer.village || '-'}</TableCell>
                    <TableCell className="text-right font-mono">
                      {customer.activeRecords > 0 ? (
                        <span className="font-medium text-green-600">{customer.activeRecords}</span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                     <TableCell className="text-right font-mono text-muted-foreground">
                      {formatCurrency(customer.totalBilled)}
                    </TableCell>
                     <TableCell className="text-right font-mono text-green-600">
                      {formatCurrency(customer.totalPaid)}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {customer.balance > 0 ? (
                        <span className="font-bold text-destructive">{formatCurrency(customer.balance)}</span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* 
        Current implementation: Server-side limit of 50 customers with search.
        Future enhancement: Add pagination for large customer bases (100+ customers).
      */}
    </>
  );
}
