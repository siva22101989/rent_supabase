
'use client';

import { useActionState, useEffect, useState, useRef, Suspense } from 'react';
import { useFormStatus } from 'react-dom';
import { useSearchParams, useRouter } from 'next/navigation';
import { SubmitButton } from '@/components/ui/submit-button';
import { addInflow, type InflowFormState } from '@/lib/actions';
// ... (rest of imports unchanged)
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

// Local SubmitButton removed in favor of shared component


import { useCustomers } from "@/contexts/customer-context";
import { useStaticData } from "@/hooks/use-static-data";

function InflowFormInner({ nextSerialNumber }: { nextSerialNumber: string }) {
    const { toast } = useToast();
    const searchParams = useSearchParams();
    const queryCustomerId = searchParams.get('customerId');
    
    // Hooks for data
    const { customers, isLoading: customersLoading } = useCustomers();
    const { crops, lots, loading: staticLoading, refresh } = useStaticData();
    const router = useRouter();
    const isLoading = customersLoading || staticLoading;
    const lastHandledRef = useRef<any>(null);

    const initialState: InflowFormState = { message: '', success: false };
    const [state, formAction] = useActionState(addInflow, initialState);

    const [bags, setBags] = useState(0);
    const [rate, setRate] = useState(0);
    const [hamali, setHamali] = useState(0);
    const [hamaliPaid, setHamaliPaid] = useState(0);
    const [selectedCustomerId, setSelectedCustomerId] = useState(queryCustomerId || '');
    const [inflowType, setInflowType] = useState<'Direct' | 'Plot'>('Direct');
    const [plotBags, setPlotBags] = useState(0);
    const [selectedLotId, setSelectedLotId] = useState('');
    const [selectedCropId, setSelectedCropId] = useState('');

    const selectedCustomer = customers.find(c => c.id === selectedCustomerId);
    const selectedLot = lots?.find(l => l.id === selectedLotId);
    const selectedCrop = crops?.find(c => c.id === selectedCropId);

    // Auto-restoration from state.data on error
    useEffect(() => {
        if (state.data) {
            if (state.data.customerId) setSelectedCustomerId(state.data.customerId);
            if (state.data.inflowType) setInflowType(state.data.inflowType);
            if (state.data.bagsStored) setBags(Number(state.data.bagsStored));
            if (state.data.plotBags) setPlotBags(Number(state.data.plotBags));
            if (state.data.hamaliRate) setRate(Number(state.data.hamaliRate));
            if (state.data.hamaliPaid) setHamaliPaid(Number(state.data.hamaliPaid));
            if (state.data.lotId) setSelectedLotId(state.data.lotId);
            if (state.data.cropId) setSelectedCropId(state.data.cropId);
        }
    }, [state.data]);
    
    // We'll use a derived state/key for Weight default if we want to force updates, or just controlled input.
    // Let's make Weight controlled slightly or just defaultValue logic.

    useEffect(() => {
        if (state.message && state !== lastHandledRef.current) {
            lastHandledRef.current = state;
            if (state.success) {
                toast({
                    title: 'Success!',
                    description: state.message,
                });
                const initRefresh = async () => {
                   await refresh();
                   router.refresh();
                };
                initRefresh();
            } else {
                toast({
                    title: 'Error',
                    description: state.message,
                    variant: 'destructive',
                });
            }
        }
    }, [state, toast, refresh, router]);

    useEffect(() => {
        const bagsValue = inflowType === 'Plot' ? plotBags : bags;
        const rateValue = rate || 0;
        
        const calculatedHamali = (bagsValue || 0) * rateValue;
        setHamali(calculatedHamali);
    }, [bags, plotBags, rate, inflowType]);


    const [error, setError] = useState<string | null>(null);

    const handleValidation = (e: React.FormEvent<HTMLFormElement>) => {
        const formData = new FormData(e.currentTarget);
        const tParams = {
            customerId: formData.get('customerId'),
            lot: formData.get('lotId'),
            crop: formData.get('cropId'),
            bags: Number(formData.get('bagsStored')),
            plotBags: Number(formData.get('plotBags')),
            type: formData.get('inflowType'),
        };

        let errMsg: string | null = null;

        if (!tParams.customerId) errMsg = 'Please select a Customer.';
        else if (!tParams.lot) errMsg = 'Please select a Lot.';
        else if (!tParams.crop) errMsg = 'Please select a Crop.';
        
        else if (tParams.type === 'Direct') {
             if (tParams.bags <= 0) errMsg = 'Number of bags must be greater than 0.';
        } else if (tParams.type === 'Plot') {
             if (tParams.plotBags <= 0) errMsg = 'Plot bags must be greater than 0.';
        }

        if (errMsg) {
            e.preventDefault(); // Stop form submission
            setError(errMsg);
            // Scroll to top to see error
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
            setError(null);
        }
    };

  return (
    <div className="flex justify-center">
        <form action={formAction} onSubmit={handleValidation} className="w-full max-w-lg">
            <Card>
                <CardHeader>
                    <CardTitle>New Storage Record Details</CardTitle>
                    <CardDescription>
                        Next Serial No: <span className="font-bold text-primary">Auto-Generated ({nextSerialNumber})</span>
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Error Alert */}
                    {error && (
                         <div className="bg-destructive/15 text-destructive text-sm p-3 rounded-md mb-4 border border-destructive/20">
                            {error}
                         </div>
                    )}

                    <div className="space-y-2">
                        <Label htmlFor="customerId">Customer <span className="text-destructive">*</span></Label>
                        <Select name="customerId" required onValueChange={setSelectedCustomerId} value={selectedCustomerId}>
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
                                <Label htmlFor="plotBags">Plot Bags <span className="text-destructive">*</span></Label>
                                <Input 
                                    id="plotBags" 
                                    name="plotBags" 
                                    type="number" 
                                    min="1"
                                    placeholder="0" 
                                    required
                                    defaultValue={state.data?.plotBags}
                                    onChange={e => setPlotBags(Number(e.target.value))} 
                                />
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="loadBags">Load Bags (Final)</Label>
                                <Input 
                                    id="loadBags" 
                                    name="loadBags" 
                                    type="number" 
                                    min="1"
                                    placeholder="0" 
                                    defaultValue={state.data?.loadBags}
                                />
                            </div>
                        </div>
                    )}


                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="cropId">Product / Crop <span className="text-destructive">*</span></Label>
                            <Select name="cropId" required onValueChange={val => {
                                setSelectedCropId(val);
                            }} value={selectedCropId}>
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
                            <Label htmlFor="lotId">Lot No. <span className="text-destructive">*</span></Label>
                            <Select name="lotId" required onValueChange={setSelectedLotId} value={selectedLotId}>
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
                            <input type="hidden" name="location" value={selectedLot ? selectedLot.name : ''} />
                        </div>
                    </div>
                     <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="lorryTractorNo">Lorry / Tractor No.</Label>
                            <Input id="lorryTractorNo" name="lorryTractorNo" placeholder="e.g., AP 21 1234" defaultValue={state.data?.lorryTractorNo} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="storageStartDate">Date <span className="text-destructive">*</span></Label>
                            <Input 
                                id="storageStartDate" 
                                name="storageStartDate" 
                                type="date"
                                defaultValue={state.data?.storageStartDate || new Date().toISOString().split('T')[0]}
                                required 
                            />
                        </div>
                    </div>
                     <div className="grid grid-cols-2 gap-4">
                        {inflowType === 'Direct' && (
                            <div className="space-y-2">
                                <Label htmlFor="bagsStored">No. of Bags <span className="text-destructive">*</span></Label>
                                <Input 
                                    id="bagsStored" 
                                    name="bagsStored" 
                                    type="number" 
                                    placeholder="0" 
                                    required 
                                    min="1"
                                    defaultValue={state.data?.bagsStored}
                                    onChange={e => setBags(Number(e.target.value))}
                                />
                            </div>
                        )}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="hamaliRate">Hamali Rate (per bag)</Label>
                            <Input id="hamaliRate" name="hamaliRate" type="number" placeholder="0.00" step="0.01" defaultValue={state.data?.hamaliRate} onChange={e => setRate(Number(e.target.value))}/>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="hamaliPaid">Hamali Paid Now</Label>
                            <Input id="hamaliPaid" name="hamaliPaid" type="number" placeholder="0.00" step="0.01" defaultValue={state.data?.hamaliPaid} onChange={e => setHamaliPaid(Number(e.target.value))}/>
                        </div>
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="khataAmount">Khata Amount (Weighbridge)</Label>
                        <Input id="khataAmount" name="khataAmount" type="number" placeholder="0.00" step="0.01" defaultValue={state.data?.khataAmount} />
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
                    <SubmitButton className="w-full">Create Storage Record</SubmitButton>
                </CardFooter>
            </Card>
        </form>
    </div>
  );
}

export function InflowForm(props: { nextSerialNumber: string }) {
    return (
        <Suspense fallback={<div className="flex justify-center p-12"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>}>
            <InflowFormInner {...props} />
        </Suspense>
    );
}
