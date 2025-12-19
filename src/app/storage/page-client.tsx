'use client';

import { useState, useMemo } from 'react';
import { AppLayout } from "@/components/layout/app-layout";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowDown, ArrowUp, Warehouse, IndianRupee, Search } from "lucide-react";
import { calculateFinalRent } from "@/lib/billing";
import { formatCurrency } from "@/lib/utils";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Pagination } from "@/components/ui/pagination";
import { Input } from "@/components/ui/input";
import type { StorageRecord } from "@/lib/definitions";
import { EditStorageDialog } from "@/components/storage/edit-storage-dialog";
import { FinalizeDryingDialog } from "@/components/storage/finalize-drying-dialog";
import Link from 'next/link';
import { FileText } from 'lucide-react';
import { EmptyState } from "@/components/ui/empty-state";
import { MobileCard } from "@/components/ui/mobile-card";


const ITEMS_PER_PAGE = 25;

export function StoragePageClient({ allRecords }: { allRecords: StorageRecord[] }) {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');

  const totalInflow = allRecords.reduce((acc, record) => acc + (record.bagsIn || 0), 0);
  const totalOutflow = allRecords.reduce((acc, record) => acc + (record.bagsOut || 0), 0);
  
  const balanceStock = allRecords.reduce((acc, record) => acc + record.bagsStored, 0);

  const activeRecords = allRecords.filter(r => !r.storageEndDate);
  const estimatedRent = activeRecords.reduce((total, record) => {
    const { rent } = calculateFinalRent(record, new Date(), record.bagsStored);
    return total + rent;
  }, 0);

  // Filter records based on search
  const filteredRecords = useMemo(() => {
    if (!searchQuery) return activeRecords;
    const query = searchQuery.toLowerCase();
    return activeRecords.filter(r => 
      r.commodityDescription?.toLowerCase().includes(query) ||
      r.location?.toLowerCase().includes(query) ||
      r.recordNumber?.toString().includes(query)
    );
  }, [activeRecords, searchQuery]);

  // Sort by date descending
  const sortedRecords = useMemo(() => 
    [...filteredRecords].sort((a, b) => 
      new Date(b.storageStartDate).getTime() - new Date(a.storageStartDate).getTime()
    ),
    [filteredRecords]
  );

  // Calculate pagination
  const totalPages = Math.ceil(sortedRecords.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedRecords = sortedRecords.slice(startIndex, endIndex);

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
  };

  const stats = { totalInflow, totalOutflow, balanceStock, estimatedRent };

  return (
    <AppLayout>
      <PageHeader
        title="Storage Overview"
        description="A high-level summary of your warehouse inventory."
        breadcrumbs={[
          { label: 'Dashboard', href: '/' },
          { label: 'Storage' }
        ]}
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Inflow</CardTitle>
                <ArrowDown className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{stats.totalInflow} bags</div>
            </CardContent>
        </Card>
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Outflow</CardTitle>
                <ArrowUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{stats.totalOutflow} bags</div>
            </CardContent>
        </Card>
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Balance Stock</CardTitle>
                <Warehouse className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{stats.balanceStock} bags</div>
            </CardContent>
        </Card>
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Estimated Rent Due</CardTitle>
                <IndianRupee className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(stats.estimatedRent)}</div>
                <p className="text-xs text-muted-foreground">
                    Based on current active stock
                </p>
            </CardContent>
        </Card>
      </div>

      {/* Detailed Stock Register */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium">Detailed Stock Register ({filteredRecords.length} active)</h3>
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by commodity, location, ID..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        
        {/* Mobile Card View */}
        <div className="md:hidden space-y-4">
          {paginatedRecords.length === 0 ? (
            <EmptyState
              icon={Warehouse}
              title={searchQuery ? "No results found" : "No active storage records"}
              description={searchQuery ? `No records match "${searchQuery}". Try a different search term.` : "Get started by adding your first inflow to create storage records."}
              actionLabel={searchQuery ? undefined : "Add First Inflow"}
              actionHref={searchQuery ? undefined : "/inflow"}
            />
          ) : (
            paginatedRecords.map((record) => {
              const { rent } = calculateFinalRent(record, new Date(), record.bagsStored);
              return (
                <MobileCard key={record.id}>
                  <MobileCard.Header>
                    <div className="flex-1">
                      <MobileCard.Title>{record.commodityDescription}</MobileCard.Title>
                      <p className="text-xs text-muted-foreground mt-1">
                        #{record.recordNumber} • {new Date(record.storageStartDate).toLocaleDateString()}
                      </p>
                    </div>
                    <MobileCard.Badge>{record.location}</MobileCard.Badge>
                  </MobileCard.Header>
                  <MobileCard.Content>
                    <MobileCard.Row label="Bags Stored" value={record.bagsStored} />
                    <MobileCard.Row label="Rent Due" value={formatCurrency(rent)} className="text-primary font-semibold" />
                  </MobileCard.Content>
                  <MobileCard.Actions>
                    {record.inflowType === 'Plot' && (!record.loadBags || record.loadBags === 0) && (
                      <FinalizeDryingDialog 
                        record={{
                          id: record.id,
                          plotBags: record.plotBags,
                          bagsStored: record.bagsStored,
                          commodityDescription: record.commodityDescription
                        }}
                      />
                    )}
                    <EditStorageDialog 
                      record={{
                        id: record.id,
                        commodityDescription: record.commodityDescription,
                        location: record.location,
                        bagsStored: record.bagsStored,
                        hamaliPayable: record.hamaliPayable || 0,
                        storageStartDate: record.storageStartDate,
                        storageEndDate: record.storageEndDate
                      }}
                      size="sm"
                    />
                    <Button asChild variant="ghost" size="sm">
                      <Link href={`/inflow/receipt/${record.id}`}>
                        <FileText className="h-4 w-4 mr-2" />
                        Receipt
                      </Link>
                    </Button>
                  </MobileCard.Actions>
                </MobileCard>
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
                            <TableHead>Date In</TableHead>
                            <TableHead>Record #</TableHead>
                            <TableHead>Location</TableHead>
                            <TableHead>Commodity</TableHead>
                            <TableHead className="text-right">Bags</TableHead>
                            <TableHead className="text-right">Rent Due</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {paginatedRecords.map((record) => {
                            const { rent } = calculateFinalRent(record, new Date(), record.bagsStored);
                            return (
                                <TableRow key={record.id}>
                                    <TableCell>{new Date(record.storageStartDate).toLocaleDateString()}</TableCell>
                                    <TableCell className="font-medium font-mono">#{record.recordNumber}</TableCell>
                                    <TableCell>
                                      <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80">
                                        {record.location}
                                      </span>
                                    </TableCell>
                                    <TableCell>{record.commodityDescription}</TableCell>
                                    <TableCell className="text-right font-medium">{record.bagsStored}</TableCell>
                                    <TableCell className="text-right text-muted-foreground">{formatCurrency(rent)}</TableCell>
                                    <TableCell className="text-right flex justify-end gap-2">
                                        {record.inflowType === 'Plot' && (!record.loadBags || record.loadBags === 0) && (
                                            <FinalizeDryingDialog 
                                                record={{
                                                    id: record.id,
                                                    plotBags: record.plotBags,
                                                    bagsStored: record.bagsStored,
                                                    commodityDescription: record.commodityDescription
                                                }}
                                            />
                                        )}
                                        <EditStorageDialog 
                                            record={{
                                                id: record.id,
                                                commodityDescription: record.commodityDescription,
                                                location: record.location,
                                                bagsStored: record.bagsStored,
                                                hamaliPayable: record.hamaliPayable || 0,
                                                storageStartDate: record.storageStartDate,
                                                storageEndDate: record.storageEndDate
                                            }}
                                            size="sm"
                                        />
                                        <Button asChild variant="ghost" size="sm" className="h-8 w-8 p-0" title="View Receipt">
                                            <Link href={`/inflow/receipt/${record.id}`}>
                                                <FileText className="h-4 w-4 text-blue-600" />
                                            </Link>
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                        {paginatedRecords.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={7} className="h-64">
                                    <EmptyState
                                        icon={Warehouse}
                                        title={searchQuery ? "No results found" : "No active storage records"}
                                        description={searchQuery ? `No records match "${searchQuery}". Try a different search term.` : "Get started by adding your first inflow to create storage records."}
                                        actionLabel={searchQuery ? undefined : "Add First Inflow"}
                                        actionHref={searchQuery ? undefined : "/inflow"}
                                    />
                                </TableCell>
                            </TableRow>
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
      </div>

    </AppLayout>
  );
}
