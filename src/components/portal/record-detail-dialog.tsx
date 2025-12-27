'use client';

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Calendar, Package, Receipt, TrendingDown, Wheat } from "lucide-react";
import { format } from "date-fns";

interface RecordDetailDialogProps {
    record: any;
    trigger?: React.ReactNode;
}

export function RecordDetailDialog({ record, trigger }: RecordDetailDialogProps) {
    const payments = record.payments || [];
    
    // For now, we don't have a direct 'outflows' table link in the portal query yet, 
    // but we can assume the UI will show payments as 'Transactions' for now.
    // In a real scenario, we'd also fetch outflows. 

    return (
        <Dialog>
            <DialogTrigger asChild>
                {trigger || (
                    <button className="text-blue-600 hover:underline text-xs font-medium">
                        View Details
                    </button>
                )}
            </DialogTrigger>
            <DialogContent className="max-w-md rounded-3xl">
                <DialogHeader>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="h-10 w-10 rounded-2xl bg-yellow-50 flex items-center justify-center border border-yellow-100">
                            <Wheat className="h-5 w-5 text-yellow-600" />
                        </div>
                        <div>
                            <DialogTitle className="text-lg font-bold">{record.crops?.name || 'Crop'}</DialogTitle>
                            <DialogDescription className="text-xs">
                                Stored since {format(new Date(record.storage_start_date), 'PPP')}
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <div className="grid grid-cols-2 gap-3 mb-6">
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                        <p className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-1">Current Stock</p>
                        <p className="text-2xl font-black text-slate-900">{record.bags_stored} <span className="text-xs font-normal text-slate-500">Bags</span></p>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                        <p className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-1">Balance Due</p>
                        <p className="text-2xl font-black text-red-600">₹{record.billed - record.paid}</p>
                    </div>
                </div>

                <div className="space-y-4">
                    <h3 className="text-sm font-bold flex items-center gap-2 px-1">
                        <Receipt className="h-4 w-4 text-slate-400" />
                        Transaction History
                    </h3>
                    
                    <ScrollArea className="h-[250px] pr-4">
                        <div className="space-y-3">
                            {/* Inital Inflow */}
                            <div className="flex items-start gap-3 p-3 rounded-2xl bg-green-50/50 border border-green-100/50">
                                <div className="mt-1 h-2 w-2 rounded-full bg-green-500" />
                                <div className="flex-1">
                                    <div className="flex justify-between items-start">
                                        <p className="text-sm font-bold text-slate-900">Initial Deposit</p>
                                        <p className="text-sm font-black text-green-700">+{record.bags_in || record.bags_stored}</p>
                                    </div>
                                    <p className="text-[10px] text-slate-500">{format(new Date(record.storage_start_date), 'MMM d, yyyy')}</p>
                                </div>
                            </div>

                            {/* Payments */}
                            {payments.map((p: any) => (
                                <div key={p.id} className="flex items-start gap-3 p-3 rounded-2xl bg-blue-50/50 border border-blue-100/50">
                                    <div className="mt-1 h-2 w-2 rounded-full bg-blue-500" />
                                    <div className="flex-1">
                                        <div className="flex justify-between items-start">
                                            <p className="text-sm font-bold text-slate-900">Payment Made</p>
                                            <p className="text-sm font-black text-blue-700">₹{p.amount}</p>
                                        </div>
                                        <p className="text-[10px] text-slate-500">{format(new Date(p.payment_date || p.created_at), 'MMM d, yyyy')}</p>
                                    </div>
                                </div>
                            ))}

                            {payments.length === 0 && (
                                <div className="text-center py-8">
                                    <p className="text-xs text-slate-400 italic">No payments recorded yet.</p>
                                </div>
                            )}
                        </div>
                    </ScrollArea>
                </div>
            </DialogContent>
        </Dialog>
    );
}
