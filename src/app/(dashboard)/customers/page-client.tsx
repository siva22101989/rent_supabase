'use client';

import { useState, useMemo, useEffect } from 'react';
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
  const [currentPage, setCurrentPage] = useState(1);
  const [localSearch, setLocalSearch] = useState(searchParams.get('search') || '');
  const debouncedSearch = useDebounce(localSearch, 500);

  // Update URL when debounced search changes
  useEffect(() => {
     const params = new URLSearchParams(searchParams);
     if (debouncedSearch) {
         params.set('search', debouncedSearch);
     } else {
         params.delete('search');
     }
     // Reset pagination on search
     if (debouncedSearch !== searchParams.get('search')) {
        setCurrentPage(1);
     }
     router.replace(`/customers?${params.toString()}`);
  }, [debouncedSearch, router, searchParams]);

  const handleSearch = (value: string) => {
    setLocalSearch(value);
  };
  
  // Since we are filtering on the server, we just display what's passed in
  // No need for client-side filtering logic
  const paginatedCustomers = initialCustomers; // Server limit is applied

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
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search all customers (Server-Side)..."
            value={localSearch}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-4">
        {paginatedCustomers.length === 0 ? (
          <EmptyState
            icon={Users}
            title={localSearch ? "No customers found" : "No customers yet"}
            description={localSearch ? `No customers match "${localSearch}".` : "Add your first customer to start tracking storage and payments."}
            actionLabel={localSearch ? undefined : "Add First Customer"}
            onAction={localSearch ? undefined : () => document.querySelector<HTMLButtonElement>('[data-add-customer-trigger]')?.click()}
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
              {paginatedCustomers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-64">
                    <EmptyState
                      icon={Users}
                      title={localSearch ? "No customers found" : "No customers yet"}
                      description={localSearch ? `No customers match "${localSearch}".` : "Add your first customer to start tracking storage and payments."}
                      actionLabel={localSearch ? undefined : "Add First Customer"}
                      onAction={localSearch ? undefined : () => document.querySelector<HTMLButtonElement>('[data-add-customer-trigger]')?.click()}
                    />
                  </TableCell>
                </TableRow>
              ) : (
                paginatedCustomers.map((customer) => (
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

      {/* Pagination removed for now as we are relying on Infinite Scroll or simple Limit 50 
          TODO: Add Server-Side Link Pagination for page 2, 3 etc. 
      */}
    </>
  );
}
