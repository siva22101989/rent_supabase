
'use client';

import { useActionState, useEffect, useState, useRef, Suspense, startTransition } from 'react';
import { useFormStatus } from 'react-dom';
import { useSearchParams, useRouter } from 'next/navigation';
import * as Sentry from "@sentry/nextjs";
import { SubmitButton } from '@/components/ui/submit-button';
import { addInflow, type InflowFormState } from '@/lib/actions/storage/inflow';
// ... (rest of imports unchanged)
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Customer } from '@/lib/definitions';
import { useUnifiedToast } from '@/components/shared/toast-provider';
import { useFeatureGate, FEATURES } from '@/lib/feature-flags';
import { Loader2 } from 'lucide-react';
import { Separator } from '../ui/separator';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';

// Local SubmitButton removed in favor of shared component


import { useCustomers } from "@/contexts/customer-context";
import { useStaticData } from "@/hooks/use-static-data";

interface InflowFormInnerProps {
    nextSerialNumber: string;
    onSuccess?: (inflow: any) => void;
    smsEnabledDefault: boolean;
    customers: any[];
    crops: any[];
    lots: any[];
    initialUnloadingRecords?: any[];
    selectedUnloadingId?: string;
}

function InflowFormInner({ 
    nextSerialNumber, 
    onSuccess, 
    smsEnabledDefault,
    customers: propCustomers,
    crops: propCrops,
    lots: propLots,
    initialUnloadingRecords = [],
    selectedUnloadingId: propSelectedUnloadingId
}: InflowFormInnerProps) {
    const { success: toastSuccess, error: toastError } = useUnifiedToast();
    const searchParams = useSearchParams();
    const queryCustomerId = searchParams.get('customerId');
    
    // Use props as initial data if available, otherwise fallback to hooks
    const { customers: hookCustomers, isLoading: customersLoading } = useCustomers();
    const { crops: hookCrops, lots: hookLots, loading: staticLoading, refresh } = useStaticData();

    const customers = propCustomers.length > 0 ? propCustomers : hookCustomers;
    const crops = propCrops.length > 0 ? propCrops : hookCrops;
    const lots = propLots.length > 0 ? propLots : hookLots;

    const router = useRouter();
    const isLoading = (propCustomers.length === 0 && customersLoading) || (propCrops.length === 0 && staticLoading);
    const lastHandledRef = useRef<any>(null);

    const initialState: InflowFormState = { message: '', success: false };
    const [state, formAction, isPending] = useActionState(addInflow, initialState);

    const [bags, setBags] = useState(0);
    const [rate, setRate] = useState(0);
    const [hamali, setHamali] = useState(0);
    const [hamaliPaid, setHamaliPaid] = useState(0);
    const [selectedCustomerId, setSelectedCustomerId] = useState(queryCustomerId || '');
    const [inflowType, setInflowType] = useState<'Direct' | 'Plot'>('Direct');
    const [plotBags, setPlotBags] = useState(0);
    const [selectedLotId, setSelectedLotId] = useState('');
    const [selectedCropId, setSelectedCropId] = useState('');
    const [sendSms, setSendSms] = useState(smsEnabledDefault);
    const [unloadingRecords, setUnloadingRecords] = useState<any[]>(initialUnloadingRecords);
    const [selectedUnloadingId, setSelectedUnloadingId] = useState(propSelectedUnloadingId || '');

    // Sync prop changes
    useEffect(() => {
        if (propSelectedUnloadingId) {
             setSelectedUnloadingId(propSelectedUnloadingId);
        }
    }, [propSelectedUnloadingId]);
    
    // ... (rest of logic) ...

    const selectedCustomer = customers.find(c => c.id === selectedCustomerId);
    const selectedLot = lots?.find(l => l.id === selectedLotId);
    const selectedCrop = crops?.find(c => c.id === selectedCropId);
    const selectedUnloading = unloadingRecords.find(u => u.id === selectedUnloadingId);

    // Auto-populate from selected unloading record
    useEffect(() => {
        if (selectedUnloading) {
            setSelectedCustomerId(selectedUnloading.customer_id);
            if (selectedUnloading.crop_id) {
                setSelectedCropId(selectedUnloading.crop_id);
            }
            if (selectedUnloading.bags_remaining) {
                setBags(selectedUnloading.bags_remaining);
            }
        }
    }, [selectedUnloading]);

    // Sync unloading records when prop updates (e.g. after adding new truck arrival)
    useEffect(() => {
        setUnloadingRecords(initialUnloadingRecords);
    }, [initialUnloadingRecords]);

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
            
            Sentry.withScope((scope) => {
                scope.setTag("form", "inflow");
                scope.setExtra("success", state.success);
                
                if (state.success) {
                    toastSuccess('Success!', state.message);
                    const initRefresh = async () => {
                        await Sentry.startSpan(
                            { name: "inflow-success-refresh", op: "ui.action.refresh" },
                            async () => {
                                await refresh();
                                router.refresh();
                            }
                        );
                    };
                    initRefresh();
                } else {
                    toastError('Error', state.message);
                }
            });
        }
    }, [state, toastSuccess, toastError, refresh, router]);

    useEffect(() => {
        const bagsValue = inflowType === 'Plot' ? plotBags : bags;
        const rateValue = rate || 0;
        
        let calculatedHamali = (bagsValue || 0) * rateValue;

        // Add Unloading Share if selected
        if (selectedUnloading && selectedUnloading.hamali_amount && selectedUnloading.bags_unloaded > 0) {
            const unloadingRate = selectedUnloading.hamali_amount / selectedUnloading.bags_unloaded;
            calculatedHamali += (bagsValue || 0) * unloadingRate;
        }

        setHamali(calculatedHamali);
    }, [bags, plotBags, rate, inflowType, selectedUnloading]);


    const [error, setError] = useState<string | null>(null);

    const handleValidation = (e: React.FormEvent<HTMLFormElement>) => {
        const formData = new FormData(e.currentTarget);
        const tParams = {
            customerId: selectedCustomerId,
            lot: selectedLotId,
            crop: selectedCropId,
            bags: (inflowType === 'Direct' ? bags : 0),
            plotBags: (inflowType === 'Plot' ? plotBags : 0),
            type: inflowType,
        };

        let errMsg: string | null = null;

        if (!tParams.customerId) errMsg = 'Please select a Customer.';
        else if (!tParams.lot) errMsg = 'Please select a Lot.';
        else if (!tParams.crop) errMsg = 'Please select a Crop.';
        
        else if (tParams.type === 'Direct') {
             if (!tParams.bags || tParams.bags <= 0) errMsg = 'Number of bags must be valid and greater than 0.';
        } else if (tParams.type === 'Plot') {
             if (!tParams.plotBags || tParams.plotBags <= 0) errMsg = 'Plot bags must be valid and greater than 0.';
        }

        const dateVal = formData.get('storageStartDate');
        if (!dateVal || isNaN(Date.parse(dateVal.toString()))) {
             errMsg = 'Please enter a valid date.';
        }

        if (errMsg) {
            e.preventDefault(); // Stop form submission
            setError(errMsg);
            // Scroll to top to see error
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
            setError(null);
            if (onSuccess) {
                startTransition(() => {
                    onSuccess({
                        id: 'optimistic-' + Date.now(),
                        date: new Date(formData.get('storageStartDate') as string),
                        customerName: selectedCustomer?.name || 'Customer',
                        commodity: selectedCrop?.name || 'Product',
                        bags: tParams.type === 'Direct' ? tParams.bags : tParams.plotBags
                    });
                });
            }
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

                    {/* Unloading Record Selector */}
                    {unloadingRecords.length > 0 && (
                        <div className="space-y-2 p-3 sm:p-4 bg-accent/50 rounded-lg border">
                            <Label htmlFor="unloadingRecord" className="text-sm">
                                Select from Unloading Record (Optional)
                            </Label>
                            <Select 
                                value={selectedUnloadingId} 
                                onValueChange={(value) => {
                                    setSelectedUnloadingId(value);
                                    if (!value) {
                                        // Clear selection
                                        setSelectedCustomerId('');
                                        setSelectedCropId('');
                                    }
                                }}
                            >
                                <SelectTrigger id="unloadingRecord" className="text-sm">
                                    <SelectValue placeholder="Choose from truck arrivals..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="_none_">-- None (Manual Entry) --</SelectItem>
                                    {unloadingRecords.map(record => (
                                        <SelectItem key={record.id} value={record.id} className="text-sm">
                                            <span className="block truncate">
                                                {record.customer?.name} - {record.commodity_description}
                                            </span>
                                            <span className="text-xs text-muted-foreground">
                                                {record.bags_remaining} bags
                                            </span>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {selectedUnloading && (
                                <div className="text-xs text-muted-foreground space-y-1">
                                    <div className="flex flex-wrap gap-x-3 gap-y-1">
                                        <span>Available: {selectedUnloading.bags_remaining} bags</span>
                                        <span>Unloaded: {new Date(selectedUnloading.unload_date).toLocaleDateString()}</span>
                                    </div>
                                    {selectedUnloading.lorry_tractor_no && (
                                        <div className="break-all">{selectedUnloading.lorry_tractor_no}</div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label htmlFor="customerId">Customer <span className="text-destructive">*</span></Label>
                        <Select 
                            key={selectedCustomerId || 'customer-select'} 
                            name="customerId" 
                            required 
                            onValueChange={setSelectedCustomerId} 
                            value={selectedCustomerId}
                        >
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
                                <Input 
                                    key={`father-${selectedCustomerId}`}
                                    id="fatherName" 
                                    name="fatherName" 
                                    defaultValue={(selectedCustomer as any).father_name || selectedCustomer.fatherName || ''} 
                                    readOnly
                                    className="bg-muted"
                                />
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="village">Village</Label>
                                <Input 
                                    key={`village-${selectedCustomerId}`}
                                    id="village" 
                                    name="village" 
                                    defaultValue={selectedCustomer.village || ''} 
                                    readOnly
                                    className="bg-muted"
                                />
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
                                    onFocus={(e) => e.target.select()}
                                    onWheel={(e) => e.currentTarget.blur()}
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
                                    onFocus={(e) => e.target.select()}
                                    onWheel={(e) => e.currentTarget.blur()}
                                />
                            </div>
                        </div>
                    )}


                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="cropId">Product / Crop <span className="text-destructive">*</span></Label>
                            <Select 
                                key={selectedCropId || 'crop-select'} 
                                name="cropId" 
                                required 
                                onValueChange={val => {
                                    setSelectedCropId(val);
                                }} 
                                value={selectedCropId}
                            >
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
                            <Select 
                                key={selectedLotId || 'lot-select'} 
                                name="lotId" 
                                required 
                                onValueChange={setSelectedLotId} 
                                value={selectedLotId}
                            >
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
                                    onFocus={(e) => e.target.select()}
                                    onWheel={(e) => e.currentTarget.blur()}
                                    onChange={e => setBags(Number(e.target.value))}
                                />
                            </div>
                        )}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="hamaliRate">Hamali Rate (per bag)</Label>
                            <Input id="hamaliRate" name="hamaliRate" type="number" placeholder="0.00" step="0.01" defaultValue={state.data?.hamaliRate} onFocus={(e) => e.target.select()} onWheel={(e) => e.currentTarget.blur()} onChange={e => setRate(Number(e.target.value))}/>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="hamaliPaid">Hamali Paid Now</Label>
                            <Input id="hamaliPaid" name="hamaliPaid" type="number" placeholder="0.00" step="0.01" defaultValue={state.data?.hamaliPaid} onFocus={(e) => e.target.select()} onWheel={(e) => e.currentTarget.blur()} onChange={e => setHamaliPaid(Number(e.target.value))}/>
                        </div>
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="khataAmount">Khata Amount (Weighbridge)</Label>
                        <Input id="khataAmount" name="khataAmount" type="number" placeholder="0.00" step="0.01" defaultValue={state.data?.khataAmount} onFocus={(e) => e.target.select()} onWheel={(e) => e.currentTarget.blur()} />
                    </div>
                     <Separator />
                    <div className="space-y-4">
                        <h4 className="font-medium">Billing Summary</h4>
                        <div className="space-y-2">
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-muted-foreground">Total Hamali Payable</span>
                                <div className="text-right">
                                    <span className="font-mono block">₹{hamali.toFixed(2)}</span>
                                    {selectedUnloading && <span className="text-[10px] text-muted-foreground block leading-tight">(Includes Unloading)</span>}
                                </div>
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
                <CardFooter className="flex justify-end gap-4">
                    <Button variant="outline" type="button" onClick={() => router.back()}>Cancel</Button>
                    <SubmitButton isLoading={isPending}>Create Storage Record</SubmitButton>
                </CardFooter>
            </Card>
            {/* Hidden Fields */}
            <input type="hidden" name="customerId" value={selectedCustomerId} />
            <input type="hidden" name="inflowType" value={inflowType} />
            <input type="hidden" name="unloadingRecordId" value={selectedUnloadingId || ''} />
            <input type="hidden" name="sendSms" value={String(sendSms)} />
        </form>
    </div>
  );
}

interface InflowFormProps {
    nextSerialNumber: string;
    onSuccess?: (inflow: any) => void;
    smsEnabledDefault: boolean;
    customers: Array<{ id: string; name: string }>;
    crops: Array<{ id: string; name: string }>;
    lots: Array<{ id: string; name: string; capacity: number; current_stock: number; commodity_description?: string }>;
    initialUnloadingRecords?: any[];
    selectedUnloadingId?: string;
}

export function InflowForm({ 
    nextSerialNumber, 
    onSuccess, 
    smsEnabledDefault, 
    customers, 
    crops, 
    lots, 
    initialUnloadingRecords = [],
    selectedUnloadingId
}: InflowFormProps) {
    return (
        <Suspense fallback={<Card className="w-full animate-pulse h-96" />}>
            <InflowFormInner 
                nextSerialNumber={nextSerialNumber} 
                onSuccess={onSuccess} 
                smsEnabledDefault={smsEnabledDefault} 
                customers={customers}
                crops={crops}
                lots={lots}
                initialUnloadingRecords={initialUnloadingRecords}
                selectedUnloadingId={selectedUnloadingId}
            />
        </Suspense>
    );
}
