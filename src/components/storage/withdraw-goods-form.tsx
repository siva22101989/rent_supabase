'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { useEffect } from 'react';
import { format } from 'date-fns';
import { CalendarIcon, Loader2 } from 'lucide-react';
import { withdrawGoods, type FormState } from '@/lib/actions';
import type { StorageRecord } from '@/lib/definitions';
import { customers } from '@/lib/data';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import React from 'react';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      Confirm Withdrawal
    </Button>
  );
}

function getCustomerName(customerId: string) {
    return customers.find(c => c.id === customerId)?.name ?? 'Unknown';
}

export function WithdrawGoodsForm({ records }: { records: StorageRecord[] }) {
  const { toast } = useToast();
  const [selectedDate, setSelectedDate] = React.useState<Date>(new Date());
  
  const [state, formAction] = useActionState<FormState, FormData>(withdrawGoods, {
    message: '',
    success: false,
  });

  useEffect(() => {
    if (state.message && !state.success) {
      toast({
        title: 'Error',
        description: state.message,
        variant: 'destructive',
      });
    }
  }, [state, toast]);

  return (
    <form action={formAction}>
      <Card>
        <CardHeader>
          <CardTitle>Goods Withdrawal</CardTitle>
          <CardDescription>Select a record to mark as withdrawn.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6">
            <div className="grid md:grid-cols-2 gap-4">
                 <div className="space-y-2">
                    <Label htmlFor="recordId">Storage Record</Label>
                    <Select name="recordId" required>
                        <SelectTrigger>
                            <SelectValue placeholder="Select a record to withdraw" />
                        </SelectTrigger>
                        <SelectContent>
                            {records.map((record) => (
                            <SelectItem key={record.id} value={record.id}>
                                {`ID: ${record.id} - ${getCustomerName(record.customerId)} - ${record.bagsStored} bags`}
                            </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
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
            <Alert variant="default" className="bg-amber-50 border-amber-200">
                <AlertTitle className="text-amber-800 font-semibold">Important Notice</AlertTitle>
                <AlertDescription className="text-amber-700">
                No refund is due for early withdrawal as the full 6-month or 1-year minimum fee was paid upon entry or rollover. This action will mark the record as completed.
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
