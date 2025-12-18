
'use client';

import { useActionState, useEffect, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { addInflow, type InflowFormState } from '@/lib/actions';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Customer } from '@/lib/definitions';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { Separator } from '../ui/separator';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';

function SubmitButton() {
    const { pending } = useFormStatus();
    return (
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Saving...
          </>
        ) : (
          'Create Storage Record'
        )}
      </Button>
    );
}

export function InflowForm({ customers, nextSerialNumber, lots, crops }: { customers: Customer[], nextSerialNumber: string, lots: any[], crops: any[] }) {
    const { toast } = useToast();
    const initialState: InflowFormState = { message: '', success: false };
    const [state, formAction] = useActionState(addInflow, initialState);

    const [bags, setBags] = useState(0);
    const [rate, setRate] = useState(0);
    const [hamali, setHamali] = useState(0);
    const [hamaliPaid, setHamaliPaid] = useState(0);
    const [selectedCustomerId, setSelectedCustomerId] = useState('');
    const [inflowType, setInflowType] = useState<'Direct' | 'Plot'>('Direct');
    const [plotBags, setPlotBags] = useState(0);
    const [selectedLotId, setSelectedLotId] = useState('');
    const [selectedCropId, setSelectedCropId] = useState('');

    const selectedCustomer = customers.find(c => c.id === selectedCustomerId);
    const selectedLot = lots?.find(l => l.id === selectedLotId);
    const selectedCrop = crops?.find(c => c.id === selectedCropId);

    // Auto-fill effects for crops
    useEffect(() => {
        if (selectedCrop) {
            // Auto-fill product name if needed, but we pass ID mostly.
            // Check if weight input exists and set it?
            // Since we use uncontrolled inputs mostly but state for calculated, we might need a ref or controlled input for weight.
            // We can just use the key trick to reset default value or set a state if we want strict control.
            // For now, let's keep it simple: we just need to ensure the ID is passed.
            // But wait, the user wants auto-fill.
        }
    }, [selectedCrop]);
    
    // We'll use a derived state/key for Weight default if we want to force updates, or just controlled input.
    // Let's make Weight controlled slightly or just defaultValue logic.
    const [weight, setWeight] = useState<string>('');

     useEffect(() => {
        if (state.message) {
            if (state.success) {
                toast({
                    title: 'Success!',
                    description: state.message,
                });
            } else {
                toast({
                    title: 'Error',
                    description: state.message,
                    variant: 'destructive',
                });
            }
        }
    }, [state, toast]);

    useEffect(() => {
        const bagsValue = inflowType === 'Plot' ? plotBags : bags;
        const rateValue = rate || 0;
        
        const calculatedHamali = (bagsValue || 0) * rateValue;
        setHamali(calculatedHamali);
    }, [bags, plotBags, rate, inflowType]);


  return (
    <div className="flex justify-center">
        <form action={formAction} className="w-full max-w-lg">
            <Card>
                <CardHeader>
                    <CardTitle>New Storage Record Details</CardTitle>
                    <CardDescription>
                        Next Serial No: <span className="font-bold text-primary">{nextSerialNumber}</span>
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="customerId">Customer</Label>
                        <Select name="customerId" required onValueChange={setSelectedCustomerId}>
                            <SelectTrigger id="customerId">
                                <SelectValue placeholder="Select a customer" />
                            </SelectTrigger>
                            <SelectContent>
                                {customers.map(customer => (
                                    <SelectItem key={customer.id} value={customer.id}>
                                        {customer.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {selectedCustomer && (
                         <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="fatherName">Father's Name</Label>
                                <Input id="fatherName" name="fatherName" defaultValue={selectedCustomer.fatherName} />
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="village">Village</Label>
                                <Input id="village" name="village" defaultValue={selectedCustomer.village} />
                            </div>
                        </div>
                    )}
                    
                    <div className="space-y-2">
                        <Label>Inflow Type</Label>
                        <RadioGroup 
                            name="inflowType"
                            defaultValue="Direct"
                            className="flex gap-4"
                            onValueChange={(value: 'Direct' | 'Plot') => setInflowType(value)}
                        >
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="Direct" id="direct" />
                                <Label htmlFor="direct">Direct</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="Plot" id="plot" />
                                <Label htmlFor="plot">Plot</Label>
                            </div>
                        </RadioGroup>
                    </div>

                    {inflowType === 'Plot' && (
                        <div className="grid grid-cols-2 gap-4">
                             <div className="space-y-2">
                                <Label htmlFor="plotBags">Plot Bags</Label>
                                <Input id="plotBags" name="plotBags" type="number" placeholder="0" onChange={e => setPlotBags(Number(e.target.value))} />
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="loadBags">Load Bags</Label>
                                <Input id="loadBags" name="loadBags" type="number" placeholder="0" />
                            </div>
                        </div>
                    )}


                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="cropId">Product / Crop</Label>
                            <Select name="cropId" onValueChange={val => {
                                setSelectedCropId(val);
                                const crop = crops?.find(c => c.id === val);
                                if (crop) {
                                    // Auto-fill logic
                                    // Assuming crop has standard_bag_weight_kg
                                    // We need to set the value of the weight input
                                    // We can use the 'key' prop trick or just rely on state if we make input controlled.
                                    // Let's use hidden inputs for calculation and allow override?
                                    // Actually, just set the state for weight if we make it controlled.
                                    // But I didn't make weight controlled yet.
                                    // Simplified: Just pass name as commodityDescription for now.
                                }
                            }}>
                                <SelectTrigger id="cropId">
                                    <SelectValue placeholder="Select Crop" />
                                </SelectTrigger>
                                <SelectContent>
                                    {crops && crops.map(crop => (
                                        <SelectItem key={crop.id} value={crop.id}>
                                            {crop.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <input type="hidden" name="commodityDescription" value={selectedCrop ? selectedCrop.name : ''} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="lotId">Lot No.</Label>
                            <Select name="lotId" onValueChange={setSelectedLotId}>
                                <SelectTrigger id="lotId">
                                    <SelectValue placeholder="Select Lot" />
                                </SelectTrigger>
                                <SelectContent>
                                    {lots && lots.map(lot => {
                                        const capacity = lot.capacity || 1000;
                                        const current = lot.current_stock || 0;
                                        const available = capacity - current;
                                        return (
                                            <SelectItem key={lot.id} value={lot.id} disabled={available <= 0}>
                                                {lot.name} (Available: {available})
                                            </SelectItem>
                                        );
                                    })}
                                </SelectContent>
                            </Select>
                            {/* Fallback Location Name if Lot is selected */}
                            <input type="hidden" name="location" value={selectedLot ? selectedLot.name : ''} />
                        </div>
                    </div>
                     <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="lorryTractorNo">Lorry / Tractor No.</Label>
                            <Input id="lorryTractorNo" name="lorryTractorNo" placeholder="e.g., AP 21 1234" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="storageStartDate">Date</Label>
                            <Input 
                                id="storageStartDate" 
                                name="storageStartDate" 
                                type="date"
                                defaultValue={new Date().toISOString().split('T')[0]}
                                required 
                            />
                        </div>
                    </div>
                     <div className="grid grid-cols-2 gap-4">
                        {inflowType === 'Direct' && (
                            <div className="space-y-2">
                                <Label htmlFor="bagsStored">No. of Bags</Label>
                                <Input 
                                    id="bagsStored" 
                                    name="bagsStored" 
                                    type="number" 
                                    placeholder="0" 
                                    required 
                                    onChange={e => setBags(Number(e.target.value))}
                                    value={bags || ''}
                                />
                            </div>
                        )}
                         <div className="space-y-2">
                            <Label htmlFor="weight">Weight (kg)</Label>
                            <Input 
                                id="weight" 
                                name="weight" 
                                type="number" 
                                step="0.01" 
                                placeholder="0.00" 
                                // Controlled or defaultValue?
                                // If I use key, it resets.
                                key={selectedCropId} // Reset when crop changes to take new default
                                defaultValue={selectedCrop ? selectedCrop.standard_bag_weight_kg : ''}
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="hamaliRate">Hamali Rate (per bag)</Label>
                            <Input id="hamaliRate" name="hamaliRate" type="number" placeholder="0.00" step="0.01" onChange={e => setRate(Number(e.target.value))}/>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="hamaliPaid">Hamali Paid Now</Label>
                            <Input id="hamaliPaid" name="hamaliPaid" type="number" placeholder="0.00" step="0.01" onChange={e => setHamaliPaid(Number(e.target.value))}/>
                        </div>
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="khataAmount">Khata Amount (Weighbridge)</Label>
                        <Input id="khataAmount" name="khataAmount" type="number" placeholder="0.00" step="0.01" />
                    </div>
                     <Separator />
                    <div className="space-y-4">
                        <h4 className="font-medium">Billing Summary</h4>
                        <div className="space-y-2">
                             <div className="flex justify-between items-center text-sm">
                                <span className="text-muted-foreground">Total Hamali Payable</span>
                                <span className="font-mono">₹{hamali.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between items-center font-semibold text-base">
                                <span className="text-destructive">Hamali Pending</span>
                                <span className="font-mono text-destructive">₹{(hamali - hamaliPaid).toFixed(2)}</span>
                            </div>
                             {selectedCrop && (
                                <div className="flex justify-between items-center text-sm mt-2 pt-2 border-t">
                                    <span className="text-muted-foreground">Est. Rent (6 Months)</span>
                                    <span className="font-mono">₹{selectedCrop.rent_price_6m} / bag</span>
                                </div>
                            )}
                            <p className="text-xs text-muted-foreground">
                                Rent will be calculated at the time of withdrawal.
                            </p>
                        </div>
                    </div>
                </CardContent>
                <CardFooter>
                    <SubmitButton />
                </CardFooter>
            </Card>
        </form>
    </div>
  );
}
