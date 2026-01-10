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
        <Card className="p-4 sm:p-6 overflow-hidden">
            <CardHeader className="p-0 pb-4 sm:pb-6">
                <CardTitle>Switch Warehouse</CardTitle>
                <CardDescription>
                    <span className="hidden sm:inline">Switch between different warehouses you have access to.</span>
                    <span className="sm:hidden">Select a warehouse to switch to.</span>
                </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 sm:gap-4 p-0">
                {warehouses.map((w) => {
                    const isActive = w.id === currentWarehouseId;
                    return (
                        <div
                            key={w.id}
                            className={`flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 rounded-lg border transition-colors gap-3 w-full min-w-0 ${
                                isActive ? 'bg-primary/5 border-primary' : 'hover:bg-muted/50'
                            }`}
                        >
                            <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                                <div className={`p-2 rounded-full shrink-0 ${isActive ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                                    <WarehouseIcon className="w-5 h-5" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <h4 className="font-medium truncate">{w.name}</h4>
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground flex-wrap min-w-0">
                                        <span className="truncate max-w-full">{w.location || 'No location'}</span>
                                        <span className="shrink-0">•</span>
                                        <Badge variant="outline" className="text-xs uppercase shrink-0">
                                            {w.role}
                                        </Badge>
                                    </div>
                                </div>
                            </div>
                            
                            {isActive ? (
                                <Button variant="ghost" size="sm" disabled className="gap-2 text-primary w-full sm:w-auto shrink-0">
                                    <Check className="w-4 h-4" />
                                    Active
                                </Button>
                            ) : (
                                <Button 
                                    variant="outline" 
                                    size="sm" 
                                    onClick={() => handleSwitch(w.id)}
                                    disabled={isPending}
                                    className="w-full sm:w-auto shrink-0"
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
