'use client';

import { addCrop } from "@/lib/admin-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { EditCropDialog } from '@/components/lots/edit-crop-dialog';
import { DeleteCropButton } from '@/components/lots/delete-crop-button';
import { Plus, Wheat, IndianRupee, Loader2 } from "lucide-react";
import { useFormStatus } from "react-dom";
import { SubmitButton } from "@/components/ui/submit-button";

type CropTabProps = {
    crops: any[];
};

// Local SubmitButton removed in favor of shared component

export function CropSettingsTab({ crops }: CropTabProps) {
    return (
        <div className="grid gap-6">
             <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <CardTitle>Crop Configuration</CardTitle>
                            <CardDescription>Configure standard rates for varying crops.</CardDescription>
                        </div>
                        <Wheat className="w-8 h-8 text-muted-foreground opacity-20" />
                    </div>
                </CardHeader>
                <CardContent className="grid gap-6">
                    <div className="rounded-xl border bg-card">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[300px]">Crop Name</TableHead>
                                    <TableHead>Rent (6M)</TableHead>
                                    <TableHead>Rent (1Y)</TableHead>
                                    <TableHead className="w-[100px] text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {crops?.map((crop) => (
                                    <TableRow key={crop.id}>
                                        <TableCell className="font-medium">
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-600">
                                                    <Wheat className="w-4 h-4" />
                                                </div>
                                                {crop.name}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <span className="inline-flex items-center px-2 py-1 rounded-md bg-muted text-xs font-medium">
                                                ₹{crop.rent_price_6m}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                             <span className="inline-flex items-center px-2 py-1 rounded-md bg-muted text-xs font-medium">
                                                ₹{crop.rent_price_1y}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                <EditCropDialog 
                                                    crop={{
                                                        id: crop.id,
                                                        name: crop.name,
                                                        rent_price_6m: crop.rent_price_6m,
                                                        rent_price_1y: crop.rent_price_1y
                                                    }}
                                                />
                                                <DeleteCropButton 
                                                    cropId={crop.id}
                                                    cropName={crop.name}
                                                />
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {(!crops || crops.length === 0) && (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center py-12 text-muted-foreground">
                                            No crops configured. Add one below to get started.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    <div className="border-t pt-6">
                       <h3 className="mb-4 text-base font-medium flex items-center gap-2">
                           <Plus className="w-4 h-4 text-primary" /> Add New Crop
                       </h3>
                       <form action={addCrop} className="grid gap-4 md:grid-cols-5 items-end bg-muted/20 p-4 rounded-lg border border-dashed">
                        <div className="grid gap-2 md:col-span-2">
                            <Label htmlFor="crop-name">Name</Label>
                            <Input id="crop-name" name="name" placeholder="e.g. Paddy" required className="bg-background" />
                        </div>
                         <div className="grid gap-2">
                            <Label htmlFor="price6m">Rent (6M)</Label>
                            <div className="relative">
                                <IndianRupee className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input id="price6m" name="price6m" type="number" step="0.01" placeholder="30" required className="pl-9 bg-background" />
                            </div>
                        </div>
                         <div className="grid gap-2">
                            <Label htmlFor="price1y">Rent (1Y)</Label>
                             <div className="relative">
                                <IndianRupee className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input id="price1y" name="price1y" type="number" step="0.01" placeholder="50" required className="pl-9 bg-background" />
                            </div>
                        </div>
                        <div className="md:col-span-5 md:col-start-5">
                            <SubmitButton className="w-full md:w-auto">
                              <Plus className="mr-2 h-4 w-4" /> Add Crop
                            </SubmitButton>
                        </div>
                       </form>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
