
'use client';

import { useActionState, useEffect, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { addOutflow, type OutflowFormState } from '@/lib/actions';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Customer, StorageRecord } from '@/lib/definitions';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ArrowUpFromDot } from 'lucide-react';
import { format } from 'date-fns';
import { Label } from '../ui/label';

function SubmitButton() {
    const { pending } = useFormStatus();
    return (
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing...
          </>
        ) : (
            <>
                <ArrowUpFromDot className="mr-2 h-4 w-4" />
                Confirm Withdrawal
            </>
        )}
      </Button>
    );
}

function getCustomerName(customerId: string, customers: Customer[]) {
    return customers.find(c => c.id === customerId)?.name ?? 'Unknown';
}


export function OutflowForm({ records, customers }: { records: StorageRecord[], customers: Customer[] }) {
    const { toast } = useToast();
    const initialState: OutflowFormState = { message: '', success: false };
    const [state, formAction] = useActionState(addOutflow, initialState);
    const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);

    const selectedRecord = records.find(r => r.id === selectedRecordId);

    useEffect(() => {
        if (state.message) {
            if (state.success) {
                // Redirect is handled by the server action, so a toast might not be seen.
            } else {
                toast({
                    title: 'Error',
                    description: state.message,
                    variant: 'destructive',
                });
            }
        }
    }, [state, toast]);

  return (
    <div className="flex justify-center">
        <form action={formAction} className="w-full max-w-2xl">
            <Card>
                <CardHeader>
                    <CardTitle>Withdraw Storage Record</CardTitle>
                    <CardDescription>Select a record to process for outflow and billing.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-2">
                        <Label>Select Record</Label>
                        <Select name="recordId" required onValueChange={(value) => setSelectedRecordId(value)}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select an active storage record" />
                            </SelectTrigger>
                            <SelectContent>
                                {records.map(record => (
                                    <SelectItem key={record.id} value={record.id}>
                                        {getCustomerName(record.customerId, customers)} - {record.commodityDescription} ({record.bagsStored} bags) - In: {format(record.storageStartDate, 'dd MMM yyyy')}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {selectedRecord && (
                        <Card className="bg-muted/50">
                            <CardHeader>
                                <CardTitle className='text-lg'>Record Details</CardTitle>
                            </CardHeader>
                            <CardContent className="grid sm:grid-cols-2 gap-4 text-sm">
                                <div>
                                    <p className="font-medium">Customer</p>
                                    <p className="text-muted-foreground">{getCustomerName(selectedRecord.customerId, customers)}</p>
                                </div>
                                <div>
                                    <p className="font-medium">Commodity</p>
                                    <p className="text-muted-foreground">{selectedRecord.commodityDescription}</p>
                                </div>
                                <div>
                                    <p className="font-medium">Bags Stored</p>
                                    <p className="text-muted-foreground">{selectedRecord.bagsStored}</p>
                                </div>
                                 <div>
                                    <p className="font-medium">Storage Start Date</p>
                                    <p className="text-muted-foreground">{format(selectedRecord.storageStartDate, 'dd MMM yyyy')}</p>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                </CardContent>
                <CardFooter>
                    <SubmitButton />
                </CardFooter>
            </Card>
        </form>
    </div>
  );
}
