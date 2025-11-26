'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useEffect } from 'react';
import { format } from 'date-fns';
import { CalendarIcon, Loader2 } from 'lucide-react';
import { addStorageRecord, type FormState } from '@/lib/actions';
import type { Customer } from '@/lib/definitions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

const NewStorageSchema = z.object({
  customerId: z.string().min(1, 'Customer is required.'),
  commodityDescription: z.string().min(3, 'Commodity must be at least 3 characters.'),
  bagsStored: z.coerce.number().int().gt(0, 'Quantity must be a positive number.'),
  storageStartDate: z.date({ required_error: 'Storage date is required.' }),
  hamaliCharges: z.coerce.number().min(0, 'Hamali charges must be a positive number.')
});

type NewStorageFormValues = z.infer<typeof NewStorageSchema>;

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      Save Record
    </Button>
  );
}

export function NewStorageForm({ customers }: { customers: Customer[] }) {
  const { toast } = useToast();

  const form = useForm<NewStorageFormValues>({
    resolver: zodResolver(NewStorageSchema),
    defaultValues: {
      storageStartDate: new Date(),
      bagsStored: 0,
      commodityDescription: '',
      customerId: '',
      hamaliCharges: 0,
    },
  });

  const [state, formAction] = useActionState<FormState, FormData>(addStorageRecord, {
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
          <CardTitle>New Storage Details</CardTitle>
          <CardDescription>Fill in the details to create a new storage record.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="customerId">Customer</Label>
               <Select name="customerId" required>
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
              <Label htmlFor="commodityDescription">Commodity Description</Label>
              <Input
                id="commodityDescription"
                name="commodityDescription"
                placeholder="e.g., Paddy, Bengalgram"
                required
              />
            </div>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="bagsStored">Quantity (Bags)</Label>
              <Input
                id="bagsStored"
                name="bagsStored"
                type="number"
                placeholder="0"
                required
                {...form.register('bagsStored')}
              />
            </div>
             <div className="space-y-2">
              <Label htmlFor="hamaliCharges">Hamali Charges</Label>
              <Input
                id="hamaliCharges"
                name="hamaliCharges"
                type="number"
                placeholder="0.00"
                required
                step="0.01"
                {...form.register('hamaliCharges')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="storageStartDate">Date In</Label>
                <input type="hidden" name="storageStartDate" value={form.watch('storageStartDate').toISOString()} />
                 <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !form.watch('storageStartDate') && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {form.watch('storageStartDate') ? format(form.watch('storageStartDate'), "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={form.watch('storageStartDate')}
                      onSelect={(date) => date && form.setValue('storageStartDate', date)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end gap-2">
           <SubmitButton />
        </CardFooter>
      </Card>
    </form>
  );
}
