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
                            className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                        >
                            <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                    <h4 className="font-semibold">{record.customer.name}</h4>
                                    <Badge variant="secondary">
                                        {record.bags_remaining} bags available
                                    </Badge>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                    {record.commodity_description} • {new Date(record.unload_date).toLocaleDateString()}
                                    {record.lorry_tractor_no && ` • ${record.lorry_tractor_no}`}
                                </p>
                                {record.bags_remaining < record.bags_unloaded && (
                                    <p className="text-xs text-muted-foreground">
                                        {record.bags_unloaded - record.bags_remaining} bags already assigned
                                    </p>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
