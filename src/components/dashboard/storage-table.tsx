

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
import { ActionsMenu } from "./actions-menu";
import { formatCurrency } from "@/lib/utils";

async function getCustomerName(customerId: string) {
  const customers = await getCustomers();
  return customers.find(c => c.id === customerId)?.name ?? 'Unknown';
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
          <TableHead>Location</TableHead>
          <TableHead className="text-right">Bags</TableHead>
          <TableHead>Start Date</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Amount Paid</TableHead>
          <TableHead className="w-[50px]"></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {await Promise.all(activeRecords.map(async (record) => {
            const statusInfo = getRecordStatus(record);
            const customerName = await getCustomerName(record.customerId);
            const amountPaid = (record.payments || []).reduce((acc, p) => acc + p.amount, 0);
            return (
              <TableRow key={record.id}>
                <TableCell className="font-medium">{customerName}</TableCell>
                <TableCell>{record.commodityDescription}</TableCell>
                <TableCell>{record.location}</TableCell>
                <TableCell className="text-right">{record.bagsStored}</TableCell>
                <TableCell>{record.storageStartDate ? format(record.storageStartDate, 'dd MMM yyyy') : 'N/A'}</TableCell>
                <TableCell>
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    Active
                  </Badge>
                </TableCell>
                <TableCell className="text-right">{formatCurrency(amountPaid)}</TableCell>
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
