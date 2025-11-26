'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { format } from 'date-fns';
import { CalendarIcon, Loader2 } from 'lucide-react';
import { withdrawGoods, type FormState } from '@/lib/actions';
import type { Customer, StorageRecord } from '@/lib/definitions';
import { customers } from '@/lib/data';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { calculateFinalRent, getRecordStatus } from '@/lib/billing';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      Confirm Withdrawal & Generate Bill
    </Button>
  );
}

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

export function WithdrawGoodsForm({ records, customers }: { records: StorageRecord[], customers: Customer[] }) {
  const { toast } = useToast();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [selectedRecordId, setSelectedRecordId] = useState<string>('');
  const [bagsToWithdraw, setBagsToWithdraw] = useState(0);

  const [bill, setBill] = useState<{rent: number, total: number} | null>(null);
  
  const [state, formAction] = useActionState<FormState, FormData>(withdrawGoods, {
    message: '',
    success: false,
  });

  const filteredRecords = useMemo(() => {
    if (!selectedCustomerId) return [];
    return records.filter(r => r.customerId === selectedCustomerId);
  }, [selectedCustomerId, records]);

  const selectedRecord = useMemo(() => {
    return records.find(r => r.id === selectedRecordId);
  }, [selectedRecordId, records]);

  useEffect(() => {
    if (selectedRecord) {
        setBagsToWithdraw(selectedRecord.bagsStored);
    } else {
        setBagsToWithdraw(0);
    }
  }, [selectedRecord]);


  useEffect(() => {
    if (state.message && !state.success) {
      toast({
        title: 'Error',
        description: state.message,
        variant: 'destructive',
      });
    }
  }, [state, toast]);

  useEffect(() => {
    if (selectedRecord) {
      const { rent } = calculateFinalRent(selectedRecord, selectedDate);
      setBill({ rent, total: selectedRecord.totalBilled + rent });
    } else {
      setBill(null);
    }
  }, [selectedRecord, selectedDate])

  return (
    <form action={formAction}>
      <Card>
        <CardHeader>
          <CardTitle>Goods Withdrawal</CardTitle>
          <CardDescription>Select a customer and record to calculate the final bill and mark as withdrawn.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6">
            <div className="grid md:grid-cols-4 gap-4">
                 <div className="space-y-2">
                    <Label htmlFor="customerId">Customer</Label>
                    <Select onValueChange={setSelectedCustomerId} required>
                        <SelectTrigger>
                            <SelectValue placeholder="Select a customer" />
                        </SelectTrigger>
                        <SelectContent>
                            {customers.map((customer) => (
                            <SelectItem key={customer.id} value={customer.id}>
                                {customer.name}
                            </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="recordId">Storage Record</Label>
                    <Select name="recordId" required onValueChange={setSelectedRecordId} disabled={!selectedCustomerId}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select a record" />
                        </SelectTrigger>
                        <SelectContent>
                            {filteredRecords.map((record) => (
                            <SelectItem key={record.id} value={record.id}>
                                {`ID: ${record.id} - ${record.commodityDescription} - ${record.bagsStored} bags`}
                            </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="bagsToWithdraw">Bags to Withdraw</Label>
                    <Input 
                        id="bagsToWithdraw"
                        name="bagsToWithdraw"
                        type="number"
                        value={bagsToWithdraw}
                        onChange={(e) => setBagsToWithdraw(Number(e.target.value))}
                        max={selectedRecord?.bagsStored}
                        min="0"
                        disabled={!selectedRecordId}
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="storageEndDate">Date Out</Label>
                    <input type="hidden" name="storageEndDate" value={selectedDate.toISOString()} />
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                            variant={"outline"}
                            className={cn(
                                "w-full justify-start text-left font-normal",
                                !selectedDate && "text-muted-foreground"
                            )}
                            disabled={!selectedRecordId}
                            >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {selectedDate ? format(selectedDate, "PPP") : <span>Pick a date</span>}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                            <Calendar
                            mode="single"
                            selected={selectedDate}
                            onSelect={(date) => date && setSelectedDate(date)}
                            initialFocus
                            />
                        </PopoverContent>
                    </Popover>
                </div>
            </div>
            
            {selectedRecord && bill && (
                <Card>
                    <CardHeader>
                        <CardTitle>Final Bill Summary</CardTitle>
                        <CardDescription>
                            For Record ID: {selectedRecord.id} ({selectedRecord.commodityDescription})
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableBody>
                                <TableRow>
                                    <TableCell className="font-medium">Commodity</TableCell>
                                    <TableCell>{selectedRecord.commodityDescription}</TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell className="font-medium">Stored Quantity</TableCell>
                                    <TableCell>{selectedRecord.bagsStored} bags</TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell className="font-medium">Withdrawing</TableCell>
                                    <TableCell>{bagsToWithdraw} bags</TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell className="font-medium">Storage Period</TableCell>
                                    <TableCell>{format(selectedRecord.storageStartDate, 'dd MMM yyyy')} to {format(selectedDate, 'dd MMM yyyy')}</TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell className="font-medium">Previously Billed</TableCell>
                                    <TableCell>{formatCurrency(selectedRecord.totalBilled)}</TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell className="font-medium">Final Rent Due</TableCell>
                                    <TableCell>{formatCurrency(bill.rent)}</TableCell>
                                </TableRow>
                                <TableRow className="font-bold text-lg bg-muted/50">
                                    <TableCell>Total Payable Amount</TableCell>
                                    <TableCell className="text-right">{formatCurrency(bill.rent)}</TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            )}

            <Alert variant="default" className="bg-amber-50 border-amber-200">
                <AlertTitle className="text-amber-800 font-semibold">Important Notice</AlertTitle>
                <AlertDescription className="text-amber-700">
                A minimum rent is charged for pre-defined periods (6 months or 1 year). The final rent shown is any outstanding amount for the current billing cycle. This action will mark the record as completed and generate a final bill.
                </AlertDescription>
            </Alert>
        </CardContent>
        <CardFooter className="flex justify-end">
          <SubmitButton />
        </CardFooter>
      </Card>
    </form>
  );
}
