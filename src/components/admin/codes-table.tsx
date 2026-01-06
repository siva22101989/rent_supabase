'use client';

import { 
    Table, 
    TableBody, 
    TableCell, 
    TableHead, 
    TableHeader, 
    TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Copy, Check } from "lucide-react";
import { useState } from "react";
import { format } from "date-fns";
import { useUnifiedToast } from "@/components/shared/toast-provider";

interface Code {
    id: string;
    code: string;
    status: 'available' | 'used';
    duration_days: number;
    created_at: string;
    used_at?: string;
    notes?: string;
    plans: {
        name: string;
        tier: string;
    };
    warehouses?: {
        name: string;
        location: string;
    } | null;
}

interface CodesTableProps {
    codes: Code[];
}

export function CodesTable({ codes }: CodesTableProps) {
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const { success } = useUnifiedToast();

    const handleCopy = (code: string, id: string) => {
        navigator.clipboard.writeText(code);
        setCopiedId(id);
        success("Copied", "Code copied to clipboard");
        setTimeout(() => setCopiedId(null), 2000);
    };

    return (
        <div className="rounded-md border bg-white shadow-sm overflow-hidden">
            <Table>
                <TableHeader>
                    <TableRow className="bg-muted/50">
                        <TableHead>Code</TableHead>
                        <TableHead>Plan</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Redeemed By</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {codes.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                                No codes generated yet.
                            </TableCell>
                        </TableRow>
                    ) : (
                        codes.map((code) => (
                            <TableRow key={code.id}>
                                <TableCell className="font-mono font-medium tracking-wide">
                                    {code.code}
                                    {code.notes && (
                                        <p className="text-xs text-muted-foreground mt-1 truncate max-w-[200px]" title={code.notes}>
                                            {code.notes}
                                        </p>
                                    )}
                                </TableCell>
                                <TableCell>
                                    <div className="flex flex-col">
                                        <span className="font-medium">{code.plans.name}</span>
                                        <span className="text-xs text-muted-foreground capitalize">{code.plans.tier} • {code.duration_days} Days</span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    {code.status === 'available' ? (
                                        <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                                            Available
                                        </Badge>
                                    ) : (
                                        <Badge variant="secondary" className="bg-slate-100 text-slate-600">
                                            Redeemed
                                        </Badge>
                                    )}
                                </TableCell>
                                <TableCell>
                                    {code.status === 'used' && code.warehouses ? (
                                        <div className="flex flex-col">
                                            <span className="text-sm font-medium">{code.warehouses.name}</span>
                                            <span className="text-xs text-muted-foreground">
                                                 {code.used_at ? format(new Date(code.used_at), 'MMM d, yyyy') : '-'}
                                            </span>
                                        </div>
                                    ) : (
                                        <span className="text-muted-foreground text-sm">—</span>
                                    )}
                                </TableCell>
                                <TableCell className="text-sm text-muted-foreground">
                                    {format(new Date(code.created_at), 'MMM d, yyyy')}
                                </TableCell>
                                <TableCell className="text-right">
                                    <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        onClick={() => handleCopy(code.code, code.id)}
                                        className="h-8 w-8 hover:bg-slate-100"
                                    >
                                        {copiedId === code.id ? (
                                            <Check className="h-4 w-4 text-emerald-600" />
                                        ) : (
                                            <Copy className="h-4 w-4 text-slate-500" />
                                        )}
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
        </div>
    );
}
