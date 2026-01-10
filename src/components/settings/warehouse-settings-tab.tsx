'use client';

import { updateWarehouseDetails } from "@/lib/admin-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Warehouse, MapPin, Phone, Mail, Box } from "lucide-react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { useFormStatus } from "react-dom";
import { SubmitButton } from "@/components/ui/submit-button";

import { WarehouseSwitcher } from "./warehouse-switcher";

type WarehouseTabProps = {
    warehouse: any;
    allWarehouses?: any[];
};

export function WarehouseSettingsTab({ warehouse, allWarehouses = [] }: WarehouseTabProps) {
    // Debug: Log warehouse data
    console.log('[WarehouseSettingsTab] Warehouse data:', warehouse);
    console.log('[WarehouseSettingsTab] All warehouses:', allWarehouses);

    // Handle missing warehouse data
    if (!warehouse) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Warehouse Not Found</CardTitle>
                    <CardDescription>
                        Unable to load warehouse details. Please try refreshing the page or contact support.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="text-sm text-muted-foreground">
                        <p>Debugging information:</p>
                        <ul className="list-disc list-inside mt-2 space-y-1">
                            <li>Warehouse data: {warehouse ? 'Present' : 'Missing'}</li>
                            <li>Available warehouses: {allWarehouses.length}</li>
                        </ul>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="grid gap-6">
            {/* Switcher at the top for easy access */}
            {allWarehouses.length > 1 && (
                 <WarehouseSwitcher warehouses={allWarehouses} currentWarehouseId={warehouse.id} />
            )}

            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <div className="space-y-1">
                        <CardTitle>Warehouse Details</CardTitle>
                        <CardDescription>Update your warehouse information and capacity.</CardDescription>
                    </div>
                </CardHeader>
                <CardContent>
                    <form action={updateWarehouseDetails} className="grid gap-4 md:grid-cols-2 mt-4">
                        <div className="grid gap-2">
                            <Label htmlFor="name">Warehouse Name</Label>
                            <div className="relative">
                                <Warehouse className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input id="name" name="name" defaultValue={warehouse?.name || ''} className="pl-9" required />
                            </div>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="location">Location</Label>
                            <div className="relative">
                                <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input id="location" name="location" defaultValue={warehouse?.location || ''} className="pl-9" />
                            </div>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="phone">Phone Number</Label>
                             <div className="relative">
                                <Phone className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input id="phone" name="phone" type="tel" defaultValue={warehouse?.phone || ''} className="pl-9" placeholder="e.g., 9703503423" />
                            </div>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="email">Email</Label>
                             <div className="relative">
                                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input id="email" name="email" type="email" defaultValue={warehouse?.email || ''} className="pl-9" placeholder="e.g., contact@warehouse.com" />
                            </div>
                        </div>
                        <div className="grid gap-2">
                             <Label htmlFor="gstNumber">GST Number</Label>
                             <div className="relative">
                                <Box className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input id="gstNumber" name="gstNumber" defaultValue={warehouse?.gst_number || ''} className="pl-9" placeholder="GSTIN" />
                            </div>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="capacity">Capacity (Bags)</Label>
                             <div className="relative">
                                <Box className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input id="capacity" name="capacity" type="number" defaultValue={warehouse?.capacity_bags || ''} className="pl-9" onFocus={(e) => e.target.select()} onWheel={(e) => e.currentTarget.blur()} />
                            </div>
                        </div>
                        <div className="md:col-span-2 flex justify-end">
                            <SubmitButton>Save Changes</SubmitButton>
                        </div>
                    </form>
                </CardContent>
            </Card>

             <Card>
                <CardHeader>
                    <CardTitle>Lot Configuration</CardTitle>
                    <CardDescription>Manage your storage lots and compartments.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between bg-muted/30 p-4 rounded-lg border gap-4">
                        <div>
                             <p className="font-medium">Storage Lots</p>
                             <p className="text-sm text-muted-foreground">Configure physical storage areas and capacities.</p>
                        </div>
                        <Button variant="outline" asChild className="w-full sm:w-auto">
                            <Link href="/settings/lots">Manage Lots</Link>
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
