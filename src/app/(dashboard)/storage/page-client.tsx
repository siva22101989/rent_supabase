'use client';

import { useMemo } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowDown, ArrowUp, Warehouse, IndianRupee, Search } from "lucide-react";
import { calculateFinalRent } from "@/lib/billing";
import { formatCurrency } from "@/lib/utils";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Pagination } from "@/components/ui/pagination";
import { Input } from "@/components/ui/input";
import type { StorageRecord, Customer } from "@/lib/definitions";
import { EditStorageDialog } from "@/components/storage/edit-storage-dialog";
import { FinalizeDryingDialog } from "@/components/storage/finalize-drying-dialog";
import Link from 'next/link';
import { FileText } from 'lucide-react';
import { EmptyState } from "@/components/ui/empty-state";
import { MobileCard } from "@/components/ui/mobile-card";
import { useDebounce } from "@uidotdev/usehooks";
import { useEffect, useState } from 'react';
import { Checkbox } from "@/components/ui/checkbox";
import { Printer } from "lucide-react";
import { ExportButton } from "@/components/shared/export-button";
import { exportStorageRecordsToExcel, generateTallyXML, downloadFile } from "@/lib/export-utils";
import { ActionsMenu } from '@/components/dashboard/actions-menu';
import useSWR from 'swr';
import { fetchStorageRecordsAction } from '@/lib/actions';
import { Loader2 } from 'lucide-react';


export function StoragePageClient({ 
  records: initialRecords, 
  totalPages: initialTotalPages, 
  currentPage: initialPage, 
  initialStats, 
  customers,
  userRole,
  crops,
  lots
}: { 
  records: StorageRecord[], 
  totalPages: number, 
  currentPage: number,
  initialStats: { totalInflow: number, totalOutflow: number, balanceStock: number }, 
  customers: Customer[] 
  userRole?: string
  crops: any[]
  lots: any[]
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  // Local state for immediate input feedback
  const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '');
  const debouncedSearch = useDebounce(searchTerm, 300);
  const [selectedRecords, setSelectedRecords] = useState<Set<string>>(new Set());
  
  // SWR for Caching & Background Updates
  const [page, setPage] = useState(initialPage);

  // Sync page state with prop when server updates (e.g. valid navigation)
  useEffect(() => {
    setPage(initialPage);
  }, [initialPage]);

  const { data, isLoading, mutate } = useSWR(
    ['storage-records', page, debouncedSearch, 'active'], 
    async ([_, p, q, s]) => fetchStorageRecordsAction(p as number, 25, q as string, s as any),
    {
        fallbackData: {
            records: initialRecords,
            totalPages: initialTotalPages,
            totalCount: 0 // Not strictly needed for UI, fallbacks cover it
        },
        revalidateOnFocus: true,
        keepPreviousData: true, // Prevents flickering during pagination
    }
  );

  const records = data?.records || initialRecords;
  const totalPages = data?.totalPages || initialTotalPages;
  const isTableLoading = isLoading && !data; // Only true loading if no cache and no fallback

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
        setSelectedRecords(new Set(records.map(r => r.id)));
    } else {
        setSelectedRecords(new Set());
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
      const newSelected = new Set(selectedRecords);
      if (checked) {
          newSelected.add(id);
      } else {
          newSelected.delete(id);
      }
      setSelectedRecords(newSelected);
  };

  const handlePrintLabels = () => {
      const ids = Array.from(selectedRecords).join(',');
      router.push(`/storage/print-labels?ids=${ids}`);
  };

  const handleExportExcel = () => {
    const recordsToExport = records.filter(r => selectedRecords.has(r.id));
    exportStorageRecordsToExcel(recordsToExport);
  };

  const handleExportTally = () => {
      const recordsToExport = selectedRecords.size > 0 
        ? records.filter(r => selectedRecords.has(r.id))
        : records;
      const xml = generateTallyXML(recordsToExport);
      downloadFile(xml, 'tally-import.xml', 'text/xml');
  };

  // Sync search with URL
  useEffect(() => {
    const params = new URLSearchParams(searchParams);
    if (debouncedSearch) {
      params.set('q', debouncedSearch);
    } else {
      params.delete('q');
    }
    // Reset to page 1 on search
    if (debouncedSearch !== searchParams.get('q')) {
        params.set('page', '1');
        setPage(1); // Reset local page immediately
    }
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }, [debouncedSearch, pathname, router, searchParams]);

  const handlePageChange = (newPage: number) => {
    setPage(newPage); // Optimistic Update

    const params = new URLSearchParams(searchParams);
    params.set('page', newPage.toString());
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const stats = useMemo(() => {
    return {
        ...initialStats,
        estimatedRent: records.reduce((total, record) => {
             const { rent } = calculateFinalRent(record, new Date(), record.bagsStored);
             return total + rent;
        }, 0)
    }
  }, [records, initialStats]);

  return (
    <>
      <PageHeader
        title="Storage Overview"
        description="A high-level summary of your warehouse inventory."
        breadcrumbs={[
          { label: 'Dashboard', href: '/' },
          { label: 'Storage' }
        ]}
      />

      {/* Stats Cards (Static/Server for now, could be SWR'd too) */}
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
                    Based on visible records
                </p>
            </CardContent>
        </Card>
      </div>

      {/* Detailed Stock Register */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <h3 className="text-lg font-medium flex items-center gap-2">
            Detailed Stock Register
            {isLoading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
          </h3>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by customer..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="hidden sm:block">
            <ExportButton 
                onExportExcel={() => exportStorageRecordsToExcel(records)} 
                onExportTally={handleExportTally}
                label="Export View"
                variant="outline"
            />
          </div>
        </div>
        
        </div>

        {/* Floating Action Bar */}
        {selectedRecords.size > 0 && (
            <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-white border shadow-lg rounded-full px-6 py-2 z-50 flex items-center gap-4 animate-in slide-in-from-bottom-5">
                <span className="text-sm font-medium">{selectedRecords.size} selected</span>
                <div className="h-4 w-px bg-border" />
                <Button size="sm" onClick={handlePrintLabels}>
                    <Printer className="h-4 w-4 mr-2" />
                    Print Labels
                </Button>
                <ExportButton 
                    onExportExcel={handleExportExcel}
                    onExportTally={handleExportTally}
                    label="Export"
                    variant="outline"
                />
                <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 rounded-full ml-2"
                    onClick={() => setSelectedRecords(new Set())}
                >
                    <span className="sr-only">Clear selection</span>
                    <ArrowDown className="h-4 w-4 rotate-180" />
                </Button>
            </div>
        )}
        
        {/* Mobile Card View */}
        <div className="md:hidden space-y-4">
          {records.length === 0 ? (
            <EmptyState
              icon={Warehouse}
              title={searchTerm ? "No results found" : "No active storage records"}
              description={searchTerm ? `No records match "${searchTerm}".` : "Get started by adding your first inflow."}
              actionLabel={searchTerm ? undefined : "Add First Inflow"}
              actionHref={searchTerm ? undefined : "/inflow"}
            />
          ) : (
            records.map((record) => {
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
                    <MobileCard.Row label="Customer" value={record.customerName || 'Unknown'} />
                    <MobileCard.Row label="Bags Stored" value={record.bagsStored} />
                    <MobileCard.Row label="Rent Due" value={formatCurrency(rent)} className="text-primary font-semibold" />
                  </MobileCard.Content>
                  <MobileCard.Actions>
                    <ActionsMenu record={record} customers={customers} crops={crops} lots={lots} userRole={userRole} />
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
                            <TableHead className="w-12">
                                <Checkbox 
                                    checked={records.length > 0 && selectedRecords.size === records.length}
                                    onCheckedChange={(checked) => handleSelectAll(!!checked)}
                                />
                            </TableHead>
                            <TableHead>Date In</TableHead>
                            <TableHead>Record #</TableHead>
                            <TableHead>Customer</TableHead>
                            <TableHead>Location</TableHead>
                            <TableHead>Commodity</TableHead>
                            <TableHead className="text-right">Bags</TableHead>
                            <TableHead className="text-right">Rent Due</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isTableLoading && records.length === 0 ? (
                           // Skeleton State if needed, but fallback keeps old records usually
                           <TableRow>
                             <TableCell colSpan={9} className="h-24 text-center">Loading...</TableCell>
                           </TableRow>
                        ) : records.map((record) => {
                            const { rent } = calculateFinalRent(record, new Date(), record.bagsStored);
                            return (
                                <TableRow key={record.id} className={selectedRecords.has(record.id) ? "bg-muted/50" : ""}>
                                    <TableCell>
                                        <Checkbox 
                                            checked={selectedRecords.has(record.id)}
                                            onCheckedChange={(checked) => handleSelectOne(record.id, !!checked)}
                                        />
                                    </TableCell>
                                    <TableCell>{new Date(record.storageStartDate).toLocaleDateString()}</TableCell>
                                    <TableCell className="font-medium font-mono">#{record.recordNumber}</TableCell>
                                    <TableCell className="font-medium">{record.customerName || 'Unknown'}</TableCell>
                                    <TableCell>
                                      <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80">
                                        {record.location}
                                      </span>
                                    </TableCell>
                                    <TableCell>{record.commodityDescription}</TableCell>
                                    <TableCell className="text-right font-medium">{record.bagsStored}</TableCell>
                                    <TableCell className="text-right text-muted-foreground">{formatCurrency(rent)}</TableCell>
                                    <TableCell className="text-right flex justify-end gap-2 items-center">
                                        {record.inflowType === 'Plot' && (!record.loadBags || record.loadBags === 0) && (
                                            <FinalizeDryingDialog 
                                                record={{
                                                    id: record.id,
                                                    plotBags: record.plotBags,
                                                    bagsStored: record.bagsStored,
                                                    commodityDescription: record.commodityDescription,
                                                    hamaliPayable: record.hamaliPayable
                                                }}
                                            />
                                        )}
                                        <ActionsMenu record={record} customers={customers} crops={crops} lots={lots} userRole={userRole} />
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                        {!isTableLoading && records.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={9} className="h-64">
                                    <EmptyState
                                        icon={Warehouse}
                                        title={searchTerm ? "No results found" : "No active storage records"}
                                        description={searchTerm ? `No records match "${searchTerm}".` : "Get started by adding your first inflow."}
                                        actionLabel={searchTerm ? undefined : "Add First Inflow"}
                                        actionHref={searchTerm ? undefined : "/inflow"}
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
            currentPage={page}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        )}

    </>
  );
}
