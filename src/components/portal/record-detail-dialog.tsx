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
import { Calendar, Package, Receipt, TrendingDown, Wheat, Download } from "lucide-react";
import { format } from "date-fns";
import { generateStatementPDF } from "@/lib/pdf-generator";

interface RecordDetailDialogProps {
    record: any;
    trigger?: React.ReactNode;
}

export function RecordDetailDialog({ record, trigger }: RecordDetailDialogProps) {
    const payments = record.payments || [];
    const withdrawals = record.withdrawal_transactions || [];
    
    // Combine and sort events
    const events = [
        {
            type: 'DEPOSIT',
            id: 'initial',
            date: new Date(record.storage_start_date),
            amount: record.bags_in || record.bags_stored, // bags
            title: 'Initial Inflow'
        },
        ...payments.map((p: any) => ({
            type: 'PAYMENT',
            id: p.id,
            date: new Date(p.payment_date || p.created_at),
            amount: p.amount, // currency
            title: 'Payment Received'
        })),
        ...withdrawals.map((w: any) => ({
            type: 'WITHDRAWAL',
            id: w.id,
            date: new Date(w.withdrawal_date || w.created_at),
            amount: w.bags_withdrawn, // bags
            title: 'Stock Withdrawal'
        }))
    ].sort((a, b) => b.date.getTime() - a.date.getTime()); // Newest first

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
                        <div className="space-y-0.5">
                            <DialogTitle className="text-lg font-bold">{record.crops?.name || 'Crop'}</DialogTitle>
                            <div className="flex items-center gap-2 text-xs text-slate-500">
                                <span className="font-medium bg-slate-100 px-1.5 py-0.5 rounded-md text-slate-600">
                                    Lot: {record.lot_name}
                                </span>
                                <span className="text-slate-300">|</span>
                                <span>Record #{record.record_number || record.id.slice(0, 8)}</span>
                            </div>
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
                            {events.map((event) => {
                                if (event.type === 'DEPOSIT') {
                                    return (
                                        <div key={event.id} className="flex items-start gap-3 p-3 rounded-2xl bg-green-50/50 border border-green-100/50">
                                            <div className="mt-1 h-2 w-2 rounded-full bg-green-500" />
                                            <div className="flex-1">
                                                <div className="flex justify-between items-start">
                                                    <p className="text-sm font-bold text-slate-900">{event.title}</p>
                                                    <p className="text-sm font-black text-green-700">+{event.amount}</p>
                                                </div>
                                                <p className="text-[10px] text-slate-500">{format(event.date, 'MMM d, yyyy')}</p>
                                            </div>
                                        </div>
                                    );
                                }
                                if (event.type === 'WITHDRAWAL') {
                                    return (
                                        <div key={event.id} className="flex items-start gap-3 p-3 rounded-2xl bg-red-50/50 border border-red-100/50">
                                            <div className="mt-1 h-2 w-2 rounded-full bg-red-500" />
                                            <div className="flex-1">
                                                <div className="flex justify-between items-start">
                                                    <p className="text-sm font-bold text-slate-900">{event.title}</p>
                                                    <p className="text-sm font-black text-red-700">-{event.amount} Bags</p>
                                                </div>
                                                <p className="text-[10px] text-slate-500">{format(event.date, 'MMM d, yyyy')}</p>
                                            </div>
                                        </div>
                                    );
                                }
                                return (
                                    <div key={event.id} className="flex items-start gap-3 p-3 rounded-2xl bg-blue-50/50 border border-blue-100/50">
                                        <div className="mt-1 h-2 w-2 rounded-full bg-blue-500" />
                                        <div className="flex-1">
                                            <div className="flex justify-between items-start">
                                                <p className="text-sm font-bold text-slate-900">{event.title}</p>
                                                <p className="text-sm font-black text-blue-700">₹{event.amount}</p>
                                            </div>
                                            <p className="text-[10px] text-slate-500">{format(event.date, 'MMM d, yyyy')}</p>
                                        </div>
                                    </div>
                                );
                            })}

                            {events.length === 0 && (
                                <div className="text-center py-8">
                                    <p className="text-xs text-slate-400 italic">No activity recorded.</p>
                                </div>
                            )}
                        </div>
                    </ScrollArea>
                </div>

                
                <div className="mt-4 pt-4 border-t border-slate-100">
                    <button 
                        onClick={() => generateStatementPDF(record, events)}
                        className="w-full py-2.5 rounded-xl bg-slate-900 text-white font-bold text-sm flex items-center justify-center gap-2 active:scale-95 transition-transform"
                    >
                        <Download className="h-4 w-4" />
                        Download PDF Statement
                    </button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
