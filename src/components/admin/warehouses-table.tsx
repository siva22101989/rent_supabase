'use client';

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
    MoreHorizontal, 
    Building2, 
    MapPin, 
    Package, 
    ExternalLink,
    Search,
    Download
} from "lucide-react";
import Link from "next/link";
import { exportToExcel } from "@/lib/export-utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { format } from "date-fns";
import { deleteWarehouseAction } from "@/lib/admin-actions";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { Input } from "@/components/ui/input";

interface AdminWarehousesTableProps {
    warehouses: any[];
}

export function AdminWarehousesTable({ warehouses }: AdminWarehousesTableProps) {
    const { toast } = useToast();
    const [searchQuery, setSearchQuery] = useState("");

    const filteredWarehouses = warehouses.filter(w => 
        w.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (w.location && w.location.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (w.email && w.email.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`Are you sure you want to delete ${name}? This action cannot be undone.`)) return;
        
        const result = await deleteWarehouseAction(id);
        if (result.success) {
            toast({
                title: "Success",
                description: "Warehouse deleted",
            });
        } else {
            toast({
                title: "Error",
                description: result.message,
                variant: "destructive",
            });
        }
    };


    const handleExport = () => {
        const data = filteredWarehouses.map(w => ({
            'Name': w.name,
            'Location': w.location || 'N/A',
            'Stock (Bags)': w.totalStock,
            'Capacity (Bags)': w.totalCapacity,
            'Occupancy Rate (%)': w.occupancyRate.toFixed(2),
            'Active Records': w.activeRecords,
            'Created At': format(new Date(w.created_at), 'yyyy-MM-dd')
        }));
        exportToExcel(data, `warehouses_export_${new Date().getTime()}`, 'Warehouses');
        toast({ title: "Export Started", description: "Your warehouse data is being downloaded." });
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div className="relative max-w-sm flex-1">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search warehouses..."
                        className="pl-9"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <Button variant="outline" size="sm" className="gap-2" onClick={handleExport}>
                    <Download className="h-4 w-4" /> Export CSV
                </Button>
            </div>
            <div className="rounded-md border bg-white">
                <Table>
                <TableHeader>
                    <TableRow className="bg-slate-50/50">
                        <TableHead className="w-[250px]">Warehouse</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead>Utilization</TableHead>
                        <TableHead>Active Records</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {filteredWarehouses.map((w) => (
                        <TableRow key={w.id}>
                            <TableCell className="font-medium">
                                <div className="flex items-center gap-2">
                                    <Building2 className="h-4 w-4 text-slate-400" />
                                    <div>
                                        <p>{w.name}</p>
                                        <p className="text-xs text-muted-foreground font-normal">{w.email || w.phone || 'No contact'}</p>
                                    </div>
                                </div>
                            </TableCell>
                            <TableCell>
                                <div className="flex items-center gap-1 text-sm text-slate-500">
                                    <MapPin className="h-3 w-3" />
                                    {w.location || 'N/A'}
                                </div>
                            </TableCell>
                            <TableCell className="min-w-[150px]">
                                <div className="space-y-1">
                                    <div className="flex justify-between text-xs">
                                        <span>{w.totalStock.toLocaleString()} / {w.totalCapacity.toLocaleString()}</span>
                                        <span className={w.occupancyRate > 90 ? "text-rose-600 font-bold" : ""}>
                                            {w.occupancyRate.toFixed(1)}%
                                        </span>
                                    </div>
                                    <Progress value={w.occupancyRate} className="h-1.5" />
                                </div>
                            </TableCell>
                            <TableCell>
                                <Badge variant="secondary" className="gap-1">
                                    <Package className="h-3 w-3" />
                                    {w.activeRecords}
                                </Badge>
                            </TableCell>
                            <TableCell className="text-xs text-slate-500">
                                {format(new Date(w.created_at), 'MMM d, yyyy')}
                            </TableCell>
                            <TableCell className="text-right">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" className="h-8 w-8 p-0">
                                            <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                        <DropdownMenuItem asChild>
                                            <Link href={`/#warehouse-${w.id}`} className="flex items-center">
                                                <ExternalLink className="mr-2 h-4 w-4" /> View Dashboard
                                            </Link>
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem className="text-rose-600 focus:text-rose-600" onClick={() => handleDelete(w.id, w.name)}>
                                            Delete Warehouse
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </TableCell>
                        </TableRow>
                    ))}
                    {filteredWarehouses.length === 0 && (
                        <TableRow>
                            <TableCell colSpan={6} className="h-24 text-center">
                                No warehouses found matching "{searchQuery}"
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    </div>
    );
}
