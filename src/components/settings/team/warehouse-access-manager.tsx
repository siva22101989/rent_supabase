'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Building2, Globe, Loader2 } from "lucide-react";
import { toggleWarehouseAccess, getMemberAssignments } from "@/lib/staff-actions";
import { getUserWarehouses } from "@/lib/warehouse-actions"; // Server Action
import { useToast } from "@/hooks/use-toast";
import { Warehouse } from "@/lib/definitions";
// UserWarehouse type is different now, using 'any' or defining a DTO type is safer

interface WarehouseAccessManagerProps {
    userId: string;
    currentUserRole?: string;
}

export function WarehouseAccessManager({ userId, currentUserRole }: WarehouseAccessManagerProps) {
    const [allWarehouses, setAllWarehouses] = useState<any[]>([]);
    const [assignments, setAssignments] = useState<{warehouse_id: string, role: string}[]>([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState<string | null>(null);
    const { toast } = useToast();

    useEffect(() => {
        async function loadData() {
            setLoading(true);
            try {
                // getUserWarehouses (action) returns: { id, role, name, location }
                // getMemberAssignments (action) returns: { warehouse_id, role }
                const [warehouses, memberAssignments] = await Promise.all([
                    getUserWarehouses(),
                    getMemberAssignments(userId)
                ]);
                setAllWarehouses(warehouses);
                setAssignments(memberAssignments);
            } catch (error) {
                console.error("Failed to load warehouse data", error);
            } finally {
                setLoading(false);
            }
        }
        loadData();
    }, [userId]);

    const handleToggle = async (warehouseId: string) => {
        setProcessingId(warehouseId);
        
        // Optimistic Update
        const previousAssignments = [...assignments];
        const isAssigned = assignments.some(a => a.warehouse_id === warehouseId);
        
        if (isAssigned) {
            setAssignments(prev => prev.filter(a => a.warehouse_id !== warehouseId));
        } else {
            setAssignments(prev => [...prev, { warehouse_id: warehouseId, role: 'staff' }]);
        }

        try {
            const result = await toggleWarehouseAccess(userId, warehouseId);
            if (result.success) {
                toast({ title: "Success", description: result.message });
                // We trust the server action to have done the work. 
                // We can optionally refresh to be 100% sure, but optimistic state is usually fine here.
                // const updated = await getMemberAssignments(userId);
                // setAssignments(updated);
            } else {
                toast({ title: "Error", description: result.message, variant: "destructive" });
                setAssignments(previousAssignments); // Revert
            }
        } catch (error) {
            toast({ title: "Error", description: "Something went wrong", variant: "destructive" });
            setAssignments(previousAssignments); // Revert
        } finally {
            setProcessingId(null);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <Card className="border-none shadow-none bg-transparent">
            <CardHeader className="px-0 pt-0">
                <CardTitle className="text-lg">Warehouse Access</CardTitle>
                <CardDescription>
                    Manage which warehouses this team member can access.
                </CardDescription>
            </CardHeader>
            <CardContent className="px-0 space-y-4">
                {allWarehouses.length === 0 ? (
                    <p className="text-sm text-muted-foreground italic">No additional warehouses found.</p>
                ) : (
                    <div className="grid gap-4">
                        {allWarehouses.map((uw) => {
                            // uw is { id, name, location... }
                            const isAssigned = assignments.some(a => a.warehouse_id === uw.id);
                            const isProcessing = processingId === uw.id;
                            
                            return (
                                <div 
                                    key={uw.id} 
                                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/30 transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                                            <Building2 className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <p className="font-medium text-sm">{uw.name || 'Unnamed Warehouse'}</p>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <Globe className="h-3 w-3 text-muted-foreground" />
                                                <span className="text-xs text-muted-foreground">{uw.location || 'No location set'}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        {isAssigned && (
                                            <Badge variant="secondary" className="text-[10px] h-5">
                                                {assignments.find(a => a.warehouse_id === uw.id)?.role || 'staff'}
                                            </Badge>
                                        )}
                                        <Switch 
                                            checked={isAssigned} 
                                            onCheckedChange={() => handleToggle(uw.id)}
                                            disabled={isProcessing}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
