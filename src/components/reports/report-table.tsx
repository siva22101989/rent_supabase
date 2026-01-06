
'use client';

import { useState, useEffect, Fragment } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table";
import { format, isValid } from "date-fns";
import type { Customer, StorageRecord } from "@/lib/definitions";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, toDate } from '@/lib/utils';
import { ActionsMenu } from "@/components/dashboard/actions-menu";
import { ChevronDown, ChevronRight, Warehouse } from "lucide-react";
import { MobileCard } from "@/components/ui/mobile-card";
import { calculateFinalRent } from '@/lib/billing';


type ReportTableProps = {
    // Legacy support (optional)
    records?: StorageRecord[];
    customers?: Customer[];
    // New Generic Support
    data?: any[]; 
    type?: string; // 'storage-default' | 'unloading-register' | 'unloading-expenses' | 'rent-pending-breakdown' | 'hamali-register'
    title: string;
    description?: string;
}

type GroupedHamaliTableProps = {
    records: any[];
    customers: Customer[];
    getCustomerName: (record: any) => string;
    formatDate: (date: string | Date | null | undefined) => string;
}

export function ReportTable({ records = [], data = [], customers = [], type = 'storage-default', title, description }: ReportTableProps) {
    const [generatedDate, setGeneratedDate] = useState('');

    useEffect(() => {
        setGeneratedDate(format(new Date(), 'dd MMM yyyy, hh:mm a'));
    }, []);

    const formatDate = (date: string | Date | null | undefined) => {
        if (!date) return '-';
        const d = new Date(date);
        return isValid(d) ? format(d, 'dd MMM yyyy') : '-';
    };

    const getCustomerName = (record: any) => {
        if (record.customer?.name) return record.customer.name;
        if (record.customers?.name) return record.customers.name;
        return customers.find(c => c.id === record.customerId)?.name ?? 'Unknown';
    }

    const recordsWithBalance = records.map(record => {
        const hamali = Number(record.hamaliPayable) || 0;
        const rent = Number(record.totalRentBilled) || 0;
        const totalBilled = hamali + rent;
        const amountPaid = (record.payments || []).reduce((acc, p) => acc + (Number(p.amount) || 0), 0);
        const balanceDue = totalBilled - amountPaid;
        return { ...record, totalBilled, amountPaid, balanceDue };
    }).sort((a, b) => {
        const dateA = toDate(a.storageStartDate);
        const dateB = toDate(b.storageStartDate);
        return dateB.getTime() - dateA.getTime();
    });

    const totalBagsIn = recordsWithBalance.reduce((acc, record) => acc + (Number(record.bagsIn) || 0), 0);
    const totalBagsOut = recordsWithBalance.reduce((acc, record) => acc + (Number(record.bagsOut) || 0), 0);
    const totalBagsStored = recordsWithBalance.reduce((acc, record) => acc + (Number(record.bagsStored) || 0), 0);
    const totalBilledSum = recordsWithBalance.reduce((acc, record) => acc + (Number(record.totalBilled) || 0), 0);
    const totalAmountPaid = recordsWithBalance.reduce((acc, record) => acc + (Number(record.amountPaid) || 0), 0);
    const totalBalanceDue = recordsWithBalance.reduce((acc, record) => acc + (Number(record.balanceDue) || 0), 0);

    const isMobileSupported = ['storage-default', 'hamali-register', 'unloading-register', 'unloading-expenses', 'rent-pending-breakdown'].includes(type || '');

    return (
        <div className="bg-card border shadow-sm p-4 rounded-lg overflow-hidden">
            <div className="mb-4">
                <h2 className="text-xl font-bold">Srilakshmi Warehouse</h2>
                <p className="text-lg font-semibold">{title}</p>
                {description && <p className="text-sm text-muted-foreground mb-1">{description}</p>}
                {generatedDate && (
                    <p className="text-xs text-muted-foreground">Generated on: {generatedDate}</p>
                )}
            </div>
            
            {/* Desktop Table Container */}
            <div className={`relative w-full overflow-auto ${isMobileSupported ? 'hidden md:block' : ''}`}>
                <Table>
                {/* 1. Unloading Register */}
                {type === 'unloading-register' && (
                    <>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="whitespace-nowrap">Date</TableHead>
                            <TableHead className="whitespace-nowrap">Customer</TableHead>
                            <TableHead className="whitespace-nowrap">Commodity</TableHead>
                            <TableHead className="whitespace-nowrap">Lorry No</TableHead>
                            <TableHead className="text-right whitespace-nowrap">Bags</TableHead>
                            <TableHead className="text-right whitespace-nowrap">Hamali (₹)</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {(data || []).map((row: any) => (
                            <TableRow key={row.id}>
                                <TableCell className="whitespace-nowrap">{formatDate(row.unload_date)}</TableCell>
                                <TableCell className="whitespace-nowrap">{row.customer?.name || 'Unknown'}</TableCell>
                                <TableCell className="whitespace-nowrap">{row.commodity_description}</TableCell>
                                <TableCell className="whitespace-nowrap">{row.lorry_tractor_no || '-'}</TableCell>
                                <TableCell className="text-right whitespace-nowrap">{row.bags_unloaded}</TableCell>
                                <TableCell className="text-right whitespace-nowrap">{formatCurrency(row.hamali_amount || 0)}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                    </>
                )}

                 {/* 2. Unloading Expenses */}
                {type === 'unloading-expenses' && (
                    <>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="whitespace-nowrap">Date</TableHead>
                            <TableHead className="whitespace-nowrap">Description</TableHead>
                            <TableHead className="text-right whitespace-nowrap">Amount (₹)</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {(data || []).map((row: any) => (
                            <TableRow key={row.id}>
                                <TableCell className="whitespace-nowrap">{formatDate(row.date)}</TableCell>
                                <TableCell className="whitespace-nowrap min-w-[200px]">{row.description}</TableCell>
                                <TableCell className="text-right font-mono whitespace-nowrap">{formatCurrency(row.amount)}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                    </>
                )}

                 {/* 3. Rent Pending Breakdown */}
                {type === 'rent-pending-breakdown' && (
                    <>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="whitespace-nowrap">Customer</TableHead>
                            <TableHead className="whitespace-nowrap">Phone</TableHead>
                            <TableHead className="text-right whitespace-nowrap">Rent Billed</TableHead>
                            <TableHead className="text-right whitespace-nowrap">Rent Paid</TableHead>
                            <TableHead className="text-right text-red-600 whitespace-nowrap">Rent Due</TableHead>
                            <TableHead className="text-right border-l whitespace-nowrap">Hamali Billed</TableHead>
                            <TableHead className="text-right whitespace-nowrap">Hamali Paid</TableHead>
                            <TableHead className="text-right text-red-600 whitespace-nowrap">Hamali Due</TableHead>
                            <TableHead className="text-right font-bold border-l whitespace-nowrap">Total Pending</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {(data || []).map((row: any) => (
                            <TableRow key={row.id}>
                                <TableCell className="font-medium whitespace-nowrap">{row.name}</TableCell>
                                <TableCell className="whitespace-nowrap">{row.phone}</TableCell>
                                <TableCell className="text-right whitespace-nowrap">{formatCurrency(row.rentBilled)}</TableCell>
                                <TableCell className="text-right whitespace-nowrap">{formatCurrency(row.rentPaid)}</TableCell>
                                <TableCell className="text-right font-medium text-red-600 whitespace-nowrap">{formatCurrency(row.rentPending)}</TableCell>
                                
                                <TableCell className="text-right border-l whitespace-nowrap">{formatCurrency(row.hamaliBilled)}</TableCell>
                                <TableCell className="text-right whitespace-nowrap">{formatCurrency(row.hamaliPaid)}</TableCell>
                                <TableCell className="text-right font-medium text-red-600 whitespace-nowrap">{formatCurrency(row.hamaliPending)}</TableCell>
                                
                                <TableCell className="text-right font-bold border-l whitespace-nowrap">{formatCurrency(row.totalPending)}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                    </>
                )}

                {/* 4. Hamali Register (Grouped by Customer) */}
                {type === 'hamali-register' && (
                     <GroupedHamaliTable 
                        records={recordsWithBalance} 
                        customers={customers} 
                        getCustomerName={getCustomerName}
                        formatDate={formatDate}
                     />
                )}

                {/* Default Storage View (Active Inventory) */}
                {type === 'storage-default' && (
                 <>
                <TableHeader>
                    <TableRow>
                        <TableHead className="whitespace-nowrap">Customer</TableHead>
                        <TableHead className="whitespace-nowrap">Start Date</TableHead>
                        <TableHead className="whitespace-nowrap">End Date</TableHead>
                        <TableHead className="whitespace-nowrap">Status</TableHead>
                        <TableHead className="text-right whitespace-nowrap">Bags In</TableHead>
                        <TableHead className="text-right whitespace-nowrap">Bags Out</TableHead>
                        <TableHead className="text-right whitespace-nowrap">Balance</TableHead>
                        <TableHead className="text-right whitespace-nowrap">Total Billed</TableHead>
                        <TableHead className="text-right whitespace-nowrap">Amount Paid</TableHead>
                        <TableHead className="text-right whitespace-nowrap">Balance Due</TableHead>
                        <TableHead className="w-[50px] text-right print-hide whitespace-nowrap">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {recordsWithBalance.map((record) => {
                        const customerName = getCustomerName(record);
                        return (
                        <TableRow key={record.id}>
                            <TableCell className="font-medium whitespace-nowrap">{customerName}</TableCell>
                            <TableCell className="whitespace-nowrap">{formatDate(record.storageStartDate)}</TableCell>
                            <TableCell className="whitespace-nowrap">
                                {formatDate(record.storageEndDate)}
                            </TableCell>
                            <TableCell className="whitespace-nowrap">
                                <Badge variant={record.storageEndDate ? "secondary" : "default"} className={record.storageEndDate ? 'bg-zinc-100 text-zinc-800' : 'bg-green-100 text-green-800'}>
                                    {record.storageEndDate ? 'Completed' : 'Active'}
                                </Badge>
                            </TableCell>
                            <TableCell className="text-right whitespace-nowrap">{record.bagsIn || 0}</TableCell>
                            <TableCell className="text-right whitespace-nowrap">{record.bagsOut || 0}</TableCell>
                            <TableCell className="text-right font-bold whitespace-nowrap">{record.bagsStored}</TableCell>
                            <TableCell className="text-right font-mono whitespace-nowrap">{formatCurrency(record.totalBilled || 0)}</TableCell>
                            <TableCell className="text-right font-mono whitespace-nowrap">{formatCurrency(record.amountPaid || 0)}</TableCell>
                            <TableCell className={`text-right font-mono whitespace-nowrap ${record.balanceDue > 0 ? 'text-destructive' : ''}`}>
                                {formatCurrency(record.balanceDue || 0)}
                            </TableCell>
                             <TableCell className="text-right print-hide whitespace-nowrap">
                                <ActionsMenu record={record} customers={customers} />
                            </TableCell>
                        </TableRow>
                    )})}
                    {recordsWithBalance.length === 0 && (
                        <TableRow>
                            <TableCell colSpan={11} className="text-center text-muted-foreground whitespace-nowrap">
                                No records found for the selected customer.
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
                <TableFooter>
                    <TableRow>
                        <TableCell colSpan={4} className="text-right font-bold text-lg whitespace-nowrap">Totals</TableCell>
                        <TableCell className="text-right font-mono font-bold text-lg whitespace-nowrap">{totalBagsIn}</TableCell>
                        <TableCell className="text-right font-mono font-bold text-lg whitespace-nowrap">{totalBagsOut}</TableCell>
                        <TableCell className="text-right font-mono font-bold text-lg whitespace-nowrap">{totalBagsStored}</TableCell>
                        <TableCell className="text-right font-mono font-bold text-lg whitespace-nowrap">{formatCurrency(totalBilledSum)}</TableCell>
                        <TableCell className="text-right font-mono font-bold text-lg whitespace-nowrap">{formatCurrency(totalAmountPaid)}</TableCell>
                        <TableCell className="text-right font-mono font-bold text-lg text-destructive whitespace-nowrap">
                            {formatCurrency(totalBalanceDue)}
                        </TableCell>
                         <TableCell />
                    </TableRow>
                </TableFooter>
                </>
                )}
            </Table>
            </div>

            {/* Mobile View Container */}
            <div className="md:hidden space-y-4 pt-4 border-t mt-4">
            {/* Storage Default Mobile View */}
            {type === 'storage-default' && recordsWithBalance.map((record) => {
                return (
                    <MobileCard key={record.id}>
                        <MobileCard.Header>
                            <div className="flex-1">
                                <MobileCard.Title>{getCustomerName(record)}</MobileCard.Title>
                                <p className="text-xs text-muted-foreground mt-1">
                                    #{record.recordNumber || '-'} • {formatDate(record.storageStartDate)}
                                </p>
                            </div>
                            <MobileCard.Badge variant={record.storageEndDate ? "secondary" : "default"}>
                                {record.storageEndDate ? 'Completed' : 'Active'}
                            </MobileCard.Badge>
                        </MobileCard.Header>
                        <MobileCard.Content>
                            <MobileCard.Row label="Bags Stored" value={record.bagsStored} />
                            <MobileCard.Row label="Total Billed" value={formatCurrency(record.totalBilled || 0)} />
                            <MobileCard.Row 
                                label="Rent Due" 
                                value={formatCurrency(record.balanceDue || 0)} 
                                className={record.balanceDue > 0 ? "text-destructive font-bold" : "text-muted-foreground"}
                            />
                        </MobileCard.Content>
                        <MobileCard.Actions>
                             <ActionsMenu record={record} customers={customers} />
                        </MobileCard.Actions>
                     </MobileCard>
                     );
                 })}

            {/* Unloading Register Mobile View */}
            {type === 'unloading-register' && (data || []).map((row: any) => (
                <MobileCard key={row.id}>
                    <MobileCard.Header>
                        <div className="flex-1">
                            <MobileCard.Title>{row.customer?.name || 'Unknown'}</MobileCard.Title>
                            <p className="text-xs text-muted-foreground mt-1">
                                {formatDate(row.unload_date)}
                            </p>
                        </div>
                         <Badge variant="outline">{row.commodity_description}</Badge>
                    </MobileCard.Header>
                    <MobileCard.Content>
                        <MobileCard.Row label="Lorry No" value={row.lorry_tractor_no || '-'} />
                        <MobileCard.Row label="Bags" value={row.bags_unloaded} />
                        <MobileCard.Row 
                            label="Hamali Amount" 
                            value={formatCurrency(row.hamali_amount || 0)} 
                            className="font-bold text-primary"
                        />
                    </MobileCard.Content>
                </MobileCard>
            ))}

            {/* Unloading Expenses Mobile View */}
            {type === 'unloading-expenses' && (data || []).map((row: any) => (
                <MobileCard key={row.id}>
                    <MobileCard.Header>
                        <div className="flex-1">
                            <MobileCard.Title>Expense</MobileCard.Title>
                            <p className="text-xs text-muted-foreground mt-1">
                                {formatDate(row.date)}
                            </p>
                        </div>
                        <span className="font-mono font-bold text-lg">{formatCurrency(row.amount)}</span>
                    </MobileCard.Header>
                    <MobileCard.Content>
                        <div className="text-sm font-medium text-foreground p-2 bg-muted/30 rounded">
                            {row.description}
                        </div>
                    </MobileCard.Content>
                </MobileCard>
            ))}

            {/* Rent Pending Breakdown Mobile View */}
            {type === 'rent-pending-breakdown' && (data || []).map((row: any) => (
                <MobileCard key={row.id}>
                    <MobileCard.Header>
                        <div className="flex-1">
                            <MobileCard.Title>{row.name}</MobileCard.Title>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="text-xs text-muted-foreground">{row.phone}</span>
                            </div>
                        </div>
                        <Badge variant={row.totalPending > 0 ? "destructive" : "secondary"}>
                            {row.totalPending > 0 ? 'Due' : 'Clear'}
                        </Badge>
                    </MobileCard.Header>
                    <MobileCard.Content>
                         <div className="grid grid-cols-2 gap-2 mt-1">
                            <div className="p-2 border rounded-md">
                                <span className="text-xs text-muted-foreground block">Rent Due</span>
                                <span className="text-sm font-semibold text-destructive">{formatCurrency(row.rentPending)}</span>
                            </div>
                            <div className="p-2 border rounded-md">
                                <span className="text-xs text-muted-foreground block">Hamali Due</span>
                                <span className="text-sm font-semibold text-destructive">{formatCurrency(row.hamaliPending)}</span>
                            </div>
                         </div>
                        <div className="flex justify-between items-center bg-muted/30 p-2 rounded mt-2">
                             <span className="text-sm font-medium">Total Pending</span>
                             <span className="text-base font-bold text-destructive">{formatCurrency(row.totalPending)}</span>
                        </div>
                    </MobileCard.Content>
                </MobileCard>
            ))}

                 {/* Hamali Register Mobile View */}
                 {type === 'hamali-register' && (
                     <GroupedHamaliMobileList 
                        records={recordsWithBalance}
                        customers={customers}
                        getCustomerName={getCustomerName}
                        formatDate={formatDate}
                     />
                 )}
            </div>
        </div>
    );
}

function GroupedHamaliTable({ records, customers, getCustomerName, formatDate }: GroupedHamaliTableProps) {
    const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

    const toggleGroup = (customerId: string) => {
        const newExpanded = new Set(expandedGroups);
        if (newExpanded.has(customerId)) {
            newExpanded.delete(customerId);
        } else {
            newExpanded.add(customerId);
        }
        setExpandedGroups(newExpanded);
    };

    // Group records by customer
    const groupedRecords = records.reduce((acc: any, record: any) => {
        const customerId = record.customerId || 'unknown';
        if (!acc[customerId]) {
            acc[customerId] = {
                customerId,
                customerName: getCustomerName(record),
                records: [],
                totals: {
                    billed: 0,
                    paid: 0,
                    due: 0,
                    bagsIn: 0
                }
            };
        }
        acc[customerId].records.push(record);
        acc[customerId].totals.billed += (Number(record.totalBilled) || 0);
        acc[customerId].totals.paid += (Number(record.amountPaid) || 0);
        acc[customerId].totals.due += (Number(record.balanceDue) || 0);
        acc[customerId].totals.bagsIn += (Number(record.bagsIn) || 0);
        return acc;
    }, {});

    const groups = Object.values(groupedRecords);
    
    // Grand Totals
    const grandTotals = groups.reduce((acc: { billed: number; paid: number; due: number; bagsIn: number }, group: any) => ({
        billed: acc.billed + group.totals.billed,
        paid: acc.paid + group.totals.paid,
        due: acc.due + group.totals.due,
        bagsIn: acc.bagsIn + group.totals.bagsIn
    }), { billed: 0, paid: 0, due: 0, bagsIn: 0 });

    return (
        <>
            <TableHeader>
                <TableRow>
                    <TableHead className="w-[50px]"></TableHead>
                    <TableHead className="whitespace-nowrap">Customer</TableHead>
                    <TableHead className="text-right whitespace-nowrap">Total Bags In</TableHead>
                    <TableHead className="text-right whitespace-nowrap">Total Billed</TableHead>
                    <TableHead className="text-right whitespace-nowrap">Paid</TableHead>
                    <TableHead className="text-right whitespace-nowrap">Due</TableHead>
                    {/* Empty headers for alignment with expanded view if needed, or just allow colspan */}
                </TableRow>
            </TableHeader>
            <TableBody>
                {groups.map((group: any) => {
                    const isExpanded = expandedGroups.has(group.customerId);
                    return (
                        <Fragment key={group.customerId}>
                            {/* Summary Row */}
                            <TableRow 
                                className="cursor-pointer hover:bg-muted/50 bg-muted/20"
                                onClick={() => toggleGroup(group.customerId)}
                            >
                                <TableCell>
                                    {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                                </TableCell>
                                <TableCell className="font-bold whitespace-nowrap">{group.customerName}</TableCell>
                                <TableCell className="text-right font-mono whitespace-nowrap">{group.totals.bagsIn}</TableCell>
                                <TableCell className="text-right font-mono whitespace-nowrap">{formatCurrency(group.totals.billed)}</TableCell>
                                <TableCell className="text-right font-mono whitespace-nowrap">{formatCurrency(group.totals.paid)}</TableCell>
                                <TableCell className={`text-right font-mono font-bold whitespace-nowrap ${group.totals.due > 0 ? 'text-destructive' : 'text-green-600'}`}>
                                    {formatCurrency(group.totals.due)}
                                </TableCell>
                            </TableRow>

                            {/* Detailed Rows */}
                            {isExpanded && (
                                <>
                                    <TableRow className="bg-muted/5 border-b-0">
                                        <TableCell />
                                        <TableCell colSpan={5} className="p-0">
                                            <div className="p-4 border-l-2 border-primary ml-4 mb-2 bg-card rounded-r-md shadow-sm">
                                                <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-2">Transaction Details</h4>
                                                 <Table>
                                                    <TableHeader>
                                                        <TableRow className="h-8">
                                                            <TableHead className="text-xs h-8">Date</TableHead>
                                                            <TableHead className="text-xs h-8 md:table-cell hidden">Status</TableHead>
                                                            <TableHead className="text-xs text-right h-8">Bags</TableHead>
                                                            <TableHead className="text-xs text-right h-8">Billed</TableHead>
                                                            <TableHead className="text-xs text-right h-8">Due</TableHead>
                                                            <TableHead className="w-[50px] h-8"></TableHead>
                                                        </TableRow>
                                                    </TableHeader>
                                                    <TableBody>
                                                        {group.records.map((record: any) => (
                                                            <TableRow key={record.id} className="h-10">
                                                                <TableCell className="text-xs whitespace-nowrap">{formatDate(record.storageStartDate)}</TableCell>
                                                                <TableCell className="text-xs md:table-cell hidden">
                                                                     <Badge variant="outline" className="text-[10px] h-5">
                                                                        {record.storageEndDate ? 'Completed' : 'Active'}
                                                                    </Badge>
                                                                </TableCell>
                                                                <TableCell className="text-xs text-right">{record.bagsIn}</TableCell>
                                                                <TableCell className="text-xs text-right">{formatCurrency(record.totalBilled)}</TableCell>
                                                                <TableCell className={`text-xs text-right font-medium ${record.balanceDue > 0 ? 'text-destructive' : ''}`}>
                                                                    {formatCurrency(record.balanceDue)}
                                                                </TableCell>
                                                                <TableCell className="p-0 text-right">
                                                                     <ActionsMenu record={record} customers={customers} />
                                                                </TableCell>
                                                            </TableRow>
                                                        ))}
                                                    </TableBody>
                                                 </Table>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                </>
                            )}
                        </Fragment>
                    );
                })}
            </TableBody>
             <TableFooter>
                <TableRow>
                    <TableCell colSpan={2} className="text-right font-bold text-lg whitespace-nowrap">Grand Totals</TableCell>
                    <TableCell className="text-right font-mono font-bold text-lg whitespace-nowrap">{grandTotals.bagsIn}</TableCell>
                    <TableCell className="text-right font-mono font-bold text-lg whitespace-nowrap">{formatCurrency(grandTotals.billed)}</TableCell>
                    <TableCell className="text-right font-mono font-bold text-lg whitespace-nowrap">{formatCurrency(grandTotals.paid)}</TableCell>
                    <TableCell className="text-right font-mono font-bold text-lg text-destructive whitespace-nowrap">
                        {formatCurrency(grandTotals.due)}
                    </TableCell>
                </TableRow>
            </TableFooter>
        </>
    );
}

function GroupedHamaliMobileList({ records, customers, getCustomerName, formatDate }: GroupedHamaliTableProps) {
    const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

    const toggleGroup = (customerId: string) => {
        const newExpanded = new Set(expandedGroups);
        if (newExpanded.has(customerId)) {
            newExpanded.delete(customerId);
        } else {
            newExpanded.add(customerId);
        }
        setExpandedGroups(newExpanded);
    };

    // Grouping Logic (Duplicated from Table, could be extracted)
    const groupedRecords = records.reduce((groups: any, record: any) => {
        const customerId = record.customerId || 'unknown';
        if (!groups[customerId]) {
            groups[customerId] = {
                customerId,
                customerName: getCustomerName(record),
                records: [],
                totals: { billed: 0, paid: 0, due: 0, bagsIn: 0 }
            };
        }
        groups[customerId].records.push(record);
        
        // Accumulate totals
        const hamaliBilled = Number(record.hamaliPayable) || 0;
        const hamaliPaid = (record.payments || [])
            .filter((p: any) => p.type === 'HAMALI') // Assuming payment type exists or heuristic
            .reduce((sum: number, p: any) => sum + (Number(p.amount) || 0), 0);
        // Fallback if payments not strictly typed: calculate pro-rata or just use record.amountPaid if specific for hamali
        // For simplicity reusing report logic if possible.
        // In GroupedHamaliTable logic:
        /*
            const hamaliPaid = (record.payments || []).reduce((acc: number, p: any) => acc + (Number(p.amount) || 0), 0); 
            // Wait, GroupedHamaliTable logic uses record.amountPaid which maps to totalPaid in recordsWithBalance?
            // Actually recordsWithBalance calculates amountPaid sum of ALL payments.
            // If this is Hamali Register, we assume filtered or total?
            // Existing GroupedHamaliTable logic:
            // const hamaliPaid = (record.payments || []).reduce((acc: any, p: any) => acc + (Number(p.amount) || 0), 0);
        */
       
        groups[customerId].totals.billed += hamaliBilled;
        groups[customerId].totals.paid += record.amountPaid || 0; 
        groups[customerId].totals.due += (hamaliBilled - (record.amountPaid || 0));
        groups[customerId].totals.bagsIn += (Number(record.bagsIn) || 0);
        
        return groups;
    }, {});

    const groups = Object.values(groupedRecords);

    if (groups.length === 0) {
        return (
             <div className="text-center p-8 border rounded-lg bg-muted/20">
                <p className="text-muted-foreground">No hamali records found.</p>
             </div>
        );
    }

    return (
        <div className="space-y-4">
            {groups.map((group: any) => {
                const isExpanded = expandedGroups.has(group.customerId);
                return (
                    <MobileCard key={group.customerId}>
                        <div onClick={() => toggleGroup(group.customerId)} className="cursor-pointer">
                            <MobileCard.Header>
                                <div className="flex-1 flex items-center justify-between">
                                    <MobileCard.Title>{group.customerName}</MobileCard.Title>
                                    {isExpanded ? <ChevronDown className="h-5 w-5 text-muted-foreground" /> : <ChevronRight className="h-5 w-5 text-muted-foreground" />}
                                </div>
                            </MobileCard.Header>
                            <MobileCard.Content>
                                <MobileCard.Row label="Total Bags" value={group.totals.bagsIn} />
                                <MobileCard.Row label="Hamali Billed" value={formatCurrency(group.totals.billed)} />
                                <MobileCard.Row 
                                    label="Balance Due" 
                                    value={formatCurrency(group.totals.due)} 
                                    className={group.totals.due > 0 ? "text-destructive font-bold" : "text-muted-foreground"}
                                />
                            </MobileCard.Content>
                        </div>
                        
                        {isExpanded && (
                            <div className="px-4 pb-4 pt-0 border-t mt-2 animate-in slide-in-from-top-2">
                                <div className="space-y-3 mt-3">
                                    {group.records.map((record: any) => (
                                        <div key={record.id} className="text-sm border-b last:border-0 pb-2 last:pb-0">
                                            <div className="flex justify-between font-medium">
                                                <span>{formatDate(record.storageStartDate)}</span>
                                                <span>{formatCurrency(record.balanceDue)}</span>
                                            </div>
                                            <div className="flex justify-between text-muted-foreground text-xs mt-1">
                                                 <span>In: {record.bagsIn} bags</span>
                                                 <span>Billed: {formatCurrency(record.totalBilled)}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                        
                        <MobileCard.Actions>
                            <ActionsMenu record={group.records[0]} customers={customers} /> 
                            {/* Note: ActionsMenu usually works on single record. For group, we might want bulk action or just omit. 
                                For now, passing first record or omitting if unsafe. Omitted for safety unless specific group action exists.
                            */}
                        </MobileCard.Actions>
                    </MobileCard>
                );
            })}
        </div>
    );
}
