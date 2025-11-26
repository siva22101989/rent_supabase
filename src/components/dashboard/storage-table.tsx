import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { customers, storageRecords } from "@/lib/data";
import type { StorageRecord } from "@/lib/definitions";
import { getRecordStatus } from "@/lib/billing";
import { format } from 'date-fns';

function getCustomerName(customerId: string) {
  return customers.find(c => c.id === customerId)?.name ?? 'Unknown';
}

function formatCurrency(amount: number) {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 2,
    }).format(amount);
}

export function StorageTable() {
    const activeRecords = storageRecords.filter(r => !r.storageEndDate);
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
        </TableRow>
      </TableHeader>
      <TableBody>
        {activeRecords.map((record) => {
            const statusInfo = getRecordStatus(record);
            return (
              <TableRow key={record.id}>
                <TableCell className="font-medium">{getCustomerName(record.customerId)}</TableCell>
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
              </TableRow>
            )
        })}
      </TableBody>
    </Table>
  );
}
