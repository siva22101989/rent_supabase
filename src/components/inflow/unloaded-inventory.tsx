import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Package } from 'lucide-react';

interface UnloadedInventoryProps {
    records: Array<{
        id: string;
        unload_date: string;
        customer: { name: string };
        commodity_description: string;
        bags_unloaded: number;
        bags_remaining: number;
        lorry_tractor_no?: string;
    }>;
}

export function UnloadedInventory({ records }: UnloadedInventoryProps) {
    if (records.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Package className="h-5 w-5" />
                        Unloaded Inventory
                    </CardTitle>
                    <CardDescription>No pending bags waiting for assignment</CardDescription>
                </CardHeader>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Unloaded Inventory
                </CardTitle>
                <CardDescription>
                    Bags unloaded but not yet assigned to plot or storage
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-3">
                    {records.map((record) => (
                        <div
                            key={record.id}
                            className="p-4 border rounded-lg hover:bg-accent/50 transition-colors space-y-2"
                        >
                            <div className="flex flex-wrap items-center gap-2">
                                <h4 className="font-semibold text-sm sm:text-base">{record.customer.name}</h4>
                                <Badge variant="secondary" className="text-xs">
                                    {record.bags_remaining} bags
                                </Badge>
                            </div>
                            <p className="text-xs sm:text-sm text-muted-foreground break-words">
                                {record.commodity_description}
                            </p>
                            <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                                <span>{new Date(record.unload_date).toLocaleDateString()}</span>
                                {record.lorry_tractor_no && (
                                    <span className="break-all">{record.lorry_tractor_no}</span>
                                )}
                            </div>
                            {record.bags_remaining < record.bags_unloaded && (
                                <p className="text-xs text-muted-foreground">
                                    {record.bags_unloaded - record.bags_remaining} bags already assigned
                                </p>
                            )}
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
