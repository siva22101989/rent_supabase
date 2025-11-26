'use client';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from 'date-fns';
import { ActionsMenu } from "./actions-menu";
import { formatCurrency, toDate } from "@/lib/utils";
import { customers as getCustomers, storageRecords as getStorageRecords } from "@/lib/data";
import { useEffect, useMemo, useState } from "react";
import type { Customer, StorageRecord } from "@/lib/definitions";

export function StorageTable() {
  const [activeRecords, setActiveRecords] = useState<StorageRecord[]>([]);
  const [allCustomers, setAllCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
        const [customersData, recordsData] = await Promise.all([
            getCustomers(),
            getStorageRecords()
        ]);
        setAllCustomers(customersData);
        setActiveRecords(recordsData.filter(r => !r.storageEndDate));
        setLoading(false);
    }
    fetchData();
  }, []);

  const getCustomerName = (customerId: string) => {
    return allCustomers?.find(c => c.id === customerId)?.name ?? 'Unknown';
  };

  if (loading) {
    return <div>Loading table...</div>;
  }

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
        {activeRecords && allCustomers && activeRecords.map((record) => {
            const customerName = getCustomerName(record.customerId);
            const amountPaid = (record.payments || []).reduce((acc, p) => acc + p.amount, 0);
            const startDate = toDate(record.storageStartDate);
            return (
              <TableRow key={record.id}>
                <TableCell className="font-medium">{customerName}</TableCell>
                <TableCell>{record.commodityDescription}</TableCell>
                <TableCell>{record.location}</TableCell>
                <TableCell className="text-right">{record.bagsStored}</TableCell>
                <TableCell>{startDate ? format(startDate, 'dd MMM yyyy') : 'N/A'}</TableCell>
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
        })}
      </TableBody>
    </Table>
  );
}
