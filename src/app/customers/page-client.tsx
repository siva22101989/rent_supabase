
'use client';

import { useState, useMemo } from 'react';
import { AppLayout } from "@/components/layout/app-layout";
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

import type { Customer, StorageRecord } from "@/lib/definitions";


const ITEMS_PER_PAGE = 20;

import { useCustomers } from "@/contexts/customer-context";

// ... imports

export function CustomersPageClient({ 
  customers: initialCustomers, // Unused now, but kept for signature compatibility if needed
  records 
}: { 
  customers: Customer[], 
  records: StorageRecord[] 
}) {
  const { customers, isLoading } = useCustomers();
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 300);

  // Filter customers based on search
  const filteredCustomers = useMemo(() => {
    if (!customers) return [];
    if (!debouncedSearch) return customers;
    const query = debouncedSearch.toLowerCase();
    return customers.filter(c => 
      c.name.toLowerCase().includes(query) ||
      c.phone?.toLowerCase().includes(query) ||
      c.email?.toLowerCase().includes(query) ||
      c.village?.toLowerCase().includes(query)
    );
  }, [customers, searchQuery]);

  // Loading State
  if (isLoading && customers.length === 0) {
      return (
          <AppLayout>
             <PageHeader title="Customers" description="Loading..." breadcrumbs={[{ label: 'Dashboard', href: '/' }, { label: 'Customers' }]}>
                 <div className="h-10 w-32 bg-muted animate-pulse rounded" />
             </PageHeader>
             <div className="space-y-4">
                 <div className="h-10 w-full bg-muted animate-pulse rounded" />
                 <div className="h-64 w-full bg-muted animate-pulse rounded" />
             </div>
          </AppLayout>
      )
  }

  // Calculate pagination
  const totalPages = Math.ceil(filteredCustomers.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedCustomers = filteredCustomers.slice(startIndex, endIndex);

  // Reset to page 1 when search changes
  const handleSearch = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
  };

  return (
    <AppLayout>
      <PageHeader
        title="Customers"
        description={`Manage your customers and view their activity. (${customers.length} total)`}
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
            placeholder="Search by name, phone, email, or village..."
            value={searchQuery}
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
            title={searchQuery ? "No customers found" : "No customers yet"}
            description={searchQuery ? `No customers match "${searchQuery}". Try a different search term.` : "Add your first customer to start tracking storage and payments."}
            actionLabel={searchQuery ? undefined : "Add First Customer"}
            onAction={searchQuery ? undefined : () => document.querySelector<HTMLButtonElement>('[data-add-customer-trigger]')?.click()}
          />
        ) : (
          paginatedCustomers.map((customer) => {
            const customerRecords = records.filter(r => r.customerId === customer.id);
            const activeBags = customerRecords
              .filter(r => !r.storageEndDate)
              .reduce((sum, r) => sum + r.bagsStored, 0);
            
            const totalDue = customerRecords.reduce((sum, r) => {
               const totalBilled = (r.hamaliPayable || 0) + (r.totalRentBilled || 0);
               const amountPaid = (r.payments || []).reduce((acc: any, p: any) => acc + p.amount, 0);
               const balance = totalBilled - amountPaid;
               return sum + (balance > 0 ? balance : 0);
            }, 0);

            return (
              <Link key={customer.id} href={`/customers/${customer.id}`} className="block">
                <MobileCard className="hover:border-primary/50 transition-colors">
                  <MobileCard.Header>
                    <div className="flex-1">
                      <MobileCard.Title>{customer.name}</MobileCard.Title>
                      <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {customer.phone}
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
                      value={activeBags > 0 ? <span className="text-green-600 font-semibold">{activeBags}</span> : <span className="text-muted-foreground">-</span>}
                    />
                    <MobileCard.Row 
                      label="Total Due" 
                      value={totalDue > 0 ? <span className="text-destructive font-bold">{formatCurrency(totalDue)}</span> : <span className="text-muted-foreground">-</span>}
                    />
                  </MobileCard.Content>
                </MobileCard>
              </Link>
            );
          })
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
                <TableHead className="text-right">Active Bags</TableHead>
                <TableHead className="text-right">Total Due</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedCustomers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-64">
                    <EmptyState
                      icon={Users}
                      title={searchQuery ? "No customers found" : "No customers yet"}
                      description={searchQuery ? `No customers match "${searchQuery}". Try a different search term.` : "Add your first customer to start tracking storage and payments."}
                      actionLabel={searchQuery ? undefined : "Add First Customer"}
                      onAction={searchQuery ? undefined : () => document.querySelector<HTMLButtonElement>('[data-add-customer-trigger]')?.click()}
                    />
                  </TableCell>
                </TableRow>
              ) : (
                paginatedCustomers.map((customer) => {
                  // Calculate insights
                  const customerRecords = records.filter(r => r.customerId === customer.id);
                  const activeBags = customerRecords
                    .filter(r => !r.storageEndDate) // Only active
                    .reduce((sum, r) => sum + r.bagsStored, 0);
                  
                  const totalDue = customerRecords.reduce((sum, r) => {
                     const totalBilled = (r.hamaliPayable || 0) + (r.totalRentBilled || 0);
                     const amountPaid = (r.payments || []).reduce((acc: any, p: any) => acc + p.amount, 0);
                     const balance = totalBilled - amountPaid;
                     // Only count positive balance (debt)
                     return sum + (balance > 0 ? balance : 0);
                  }, 0);

                  return (
                    <TableRow key={customer.id}>
                      <TableCell className="font-medium">
                        <Link href={`/customers/${customer.id}`} className="hover:underline">
                          <div className="text-base font-semibold text-primary">{customer.name}</div>
                        </Link>
                        <div className="text-xs text-muted-foreground">{customer.email || '-'}</div>
                      </TableCell>
                      <TableCell>{customer.phone}</TableCell>
                      <TableCell>{customer.village || customer.address}</TableCell>
                      <TableCell className="text-right font-mono">
                        {activeBags > 0 ? (
                          <span className="font-medium text-green-600">{activeBags}</span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {totalDue > 0 ? (
                          <span className="font-bold text-destructive">{formatCurrency(totalDue)}</span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      )}
    </AppLayout>
  );
}
