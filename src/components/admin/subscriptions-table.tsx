'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Pencil } from 'lucide-react';
import { format } from 'date-fns';
import { updateSubscriptionAdmin } from '@/lib/subscription-actions';
import { useUnifiedToast } from '@/components/shared/toast-provider';

interface SubscriptionData {
    warehouseId: string;
    warehouseName: string;
    location: string;
    subscription: {
        id: string;
        status: 'active' | 'incomplete' | 'past_due' | 'canceled' | 'unpaid';
        current_period_end: string | null;
        plan_id: string;
        plans?: {
            id: string;
            name: string;
            tier: string;
        }
    } | null;
}

interface Plan {
    id: string;
    name: string;
    tier: string;
    price: number | string;
}

interface SubscriptionsTableProps {
    initialData: SubscriptionData[];
    plans: Plan[];
}

export function SubscriptionsTable({ initialData, plans }: SubscriptionsTableProps) {
    const router = useRouter();
    const { success, error } = useUnifiedToast();
    const [selectedItem, setSelectedItem] = useState<SubscriptionData | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // Form Stats
    const [editPlanId, setEditPlanId] = useState('');
    const [editStatus, setEditStatus] = useState<string>('active');
    const [editEndDate, setEditEndDate] = useState('');

    const openEdit = (item: SubscriptionData) => {
        setSelectedItem(item);
        setEditPlanId(item.subscription?.plan_id || plans[0]?.id || '');
        setEditStatus(item.subscription?.status || 'active');
        setEditEndDate(item.subscription?.current_period_end ? new Date(item.subscription.current_period_end).toISOString().split('T')[0] : '');
        setIsDialogOpen(true);
    };

    const handleSave = async () => {
        if (!selectedItem) return;
        setIsLoading(true);

        const res = await updateSubscriptionAdmin(
            selectedItem.warehouseId, 
            editPlanId, 
            editStatus as any, 
            editEndDate || undefined
        );

        setIsLoading(false);
        if (res.success) {
            success("Updated", res.message);
            setIsDialogOpen(false);
            router.refresh();
        } else {
            error("Error", res.message);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active': return 'default'; // primary
            case 'incomplete': return 'secondary';
            case 'past_due': return 'destructive';
            case 'canceled': return 'outline';
            default: return 'outline';
        }
    };

    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Warehouse</TableHead>
                        <TableHead>Plan</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Expires</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {initialData.map((item) => (
                        <TableRow key={item.warehouseId}>
                            <TableCell>
                                <div className="font-medium">{item.warehouseName}</div>
                                <div className="text-xs text-muted-foreground">{item.location}</div>
                            </TableCell>
                            <TableCell>
                                {item.subscription?.plans?.name || 'No Plan'}
                            </TableCell>
                            <TableCell>
                                <Badge variant={getStatusColor(item.subscription?.status || 'none') as any}>
                                    {item.subscription?.status || 'None'}
                                </Badge>
                            </TableCell>
                            <TableCell>
                                {item.subscription?.current_period_end 
                                    ? format(new Date(item.subscription.current_period_end), 'MMM d, yyyy') 
                                    : '-'}
                            </TableCell>
                            <TableCell className="text-right">
                                <Button size="sm" variant="ghost" onClick={() => openEdit(item)}>
                                    <Pencil className="h-4 w-4" />
                                </Button>
                            </TableCell>
                        </TableRow>
                    ))}
                    {initialData.length === 0 && (
                        <TableRow>
                            <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                                No warehouses found.
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Manage Subscription</DialogTitle>
                        <DialogDescription>
                            Edit subscription details for {selectedItem?.warehouseName}.
                        </DialogDescription>
                    </DialogHeader>
                    
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="plan" className="text-right">Plan</Label>
                            <Select value={editPlanId} onValueChange={setEditPlanId}>
                                <SelectTrigger className="col-span-3">
                                    <SelectValue placeholder="Select Plan" />
                                </SelectTrigger>
                                <SelectContent>
                                    {plans.map(p => (
                                        <SelectItem key={p.id} value={p.id}>{p.name} - {p.tier}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="status" className="text-right">Status</Label>
                            <Select value={editStatus} onValueChange={setEditStatus}>
                                <SelectTrigger className="col-span-3">
                                    <SelectValue placeholder="Select Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="active">Active</SelectItem>
                                    <SelectItem value="incomplete">Incomplete</SelectItem>
                                    <SelectItem value="past_due">Past Due</SelectItem>
                                    <SelectItem value="canceled">Canceled</SelectItem>
                                    <SelectItem value="unpaid">Unpaid</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="date" className="text-right">Expiry Date</Label>
                            <Input 
                                id="date" 
                                type="date" 
                                className="col-span-3" 
                                value={editEndDate} 
                                onChange={(e) => setEditEndDate(e.target.value)} 
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isLoading}>
                            Cancel
                        </Button>
                        <Button onClick={handleSave} disabled={isLoading}>
                            {isLoading ? 'Saving...' : 'Save Changes'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
