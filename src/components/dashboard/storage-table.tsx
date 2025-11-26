
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { customers as getCustomers, storageRecords as getStorageRecords } from "@/lib/data";
import { getRecordStatus } from "@/lib/billing";
import { format } from 'date-fns';
import { MoreHorizontal } from "lucide-react";
import { Button } from "../ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../ui/dropdown-menu";
import type { Customer, StorageRecord } from "@/lib/definitions";
import { EditStorageDialog } from "./edit-storage-dialog";

async function getCustomerName(customerId: string) {
  const customers = await getCustomers();
  return customers.find(c => c.id === customerId)?.name ?? 'Unknown';
}

function formatCurrency(amount: number) {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 2,
    }).format(amount);
}

function ActionsMenu({ record, customers }: { record: StorageRecord, customers: Customer[] }) {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                    <span className="sr-only">Open menu</span>
                    <MoreHorizontal className="h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <EditStorageDialog record={record} customers={customers}>
                    <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                        Edit
                    </DropdownMenuItem>
                </EditStorageDialog>
                {/* We can add a delete option here in the future if needed */}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

export async function StorageTable() {
    const allRecords = await getStorageRecords();
    const allCustomers = await getCustomers();
    const activeRecords = allRecords.filter(r => !r.storageEndDate);
    
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Customer</TableHead>
          <TableHead>Commodity</TableHead>
          <TableHead className="text-right">Bags</TableHead>
          <TableHead>Start Date</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Next Billing</TableHead>
          <TableHead className="text-right">Rate</TableHead>
          <TableHead className="text-right">Hamali</TableHead>
          <TableHead className="w-[50px]"></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {await Promise.all(activeRecords.map(async (record) => {
            const statusInfo = getRecordStatus(record);
            const customerName = await getCustomerName(record.customerId);
            return (
              <TableRow key={record.id}>
                <TableCell className="font-medium">{customerName}</TableCell>
                <TableCell>{record.commodityDescription}</TableCell>
                <TableCell className="text-right">{record.bagsStored}</TableCell>
                <TableCell>{format(record.storageStartDate, 'dd MMM yyyy')}</TableCell>
                <TableCell>
                  <Badge variant={statusInfo.alert ? "destructive" : "secondary"} className={statusInfo.alert ? "bg-accent/80 text-accent-foreground" : ""}>
                    {statusInfo.status}
                  </Badge>
                </TableCell>
                <TableCell>
                    {statusInfo.nextBillingDate ? format(statusInfo.nextBillingDate, 'dd MMM yyyy') : 'N/A'}
                </TableCell>
                <TableCell className="text-right">{formatCurrency(statusInfo.currentRate)}</TableCell>
                <TableCell className="text-right">{formatCurrency(record.hamaliCharges)}</TableCell>
                <TableCell>
                    <ActionsMenu record={record} customers={allCustomers} />
                </TableCell>
              </TableRow>
            )
        }))}
      </TableBody>
    </Table>
  );
}
