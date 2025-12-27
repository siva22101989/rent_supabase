'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, Warehouse as WarehouseIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useTransition } from "react";
import { switchWarehouse } from "@/lib/warehouse-actions";
import { toast } from "@/hooks/use-toast";

interface WarehouseSwitcherProps {
    warehouses: any[];
    currentWarehouseId: string;
}

export function WarehouseSwitcher({ warehouses, currentWarehouseId }: WarehouseSwitcherProps) {
    const [isPending, startTransition] = useTransition();

    const handleSwitch = (warehouseId: string) => {
        if (warehouseId === currentWarehouseId) return;

        startTransition(async () => {
            const result = await switchWarehouse(warehouseId);
            if (result.success) {
                toast({
                    title: "Switched Warehouse",
                    description: result.message,
                });
                window.location.reload(); // Hard reload to ensure all contexts update (safe bet for global state)
            } else {
                toast({
                    title: "Error",
                    description: result.message,
                    variant: "destructive",
                });
            }
        });
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Switch Warehouse</CardTitle>
                <CardDescription>
                    Switch between different warehouses you have access to.
                </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
                {warehouses.map((w) => {
                    const isActive = w.id === currentWarehouseId;
                    return (
                        <div
                            key={w.id}
                            className={`flex items-center justify-between p-4 rounded-lg border transition-colors ${
                                isActive ? 'bg-primary/5 border-primary' : 'hover:bg-muted/50'
                            }`}
                        >
                            <div className="flex items-center gap-4">
                                <div className={`p-2 rounded-full ${isActive ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                                    <WarehouseIcon className="w-5 h-5" />
                                </div>
                                <div>
                                    <h4 className="font-medium">{w.name}</h4>
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <span>{w.location || 'No location'}</span>
                                        <span>•</span>
                                        <Badge variant="outline" className="text-xs uppercase scale-90 origin-left">
                                            {w.role}
                                        </Badge>
                                    </div>
                                </div>
                            </div>
                            
                            {isActive ? (
                                <Button variant="ghost" size="sm" disabled className="gap-2 text-primary">
                                    <Check className="w-4 h-4" />
                                    Active
                                </Button>
                            ) : (
                                <Button 
                                    variant="outline" 
                                    size="sm" 
                                    onClick={() => handleSwitch(w.id)}
                                    disabled={isPending}
                                >
                                    Switch
                                </Button>
                            )}
                        </div>
                    );
                })}

                {warehouses.length === 0 && (
                    <div className="text-center py-6 text-muted-foreground text-sm">
                        No other warehouses found.
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
