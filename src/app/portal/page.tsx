
import { getCustomerPortfolio } from '@/lib/portal-queries';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Package, MapPin, Calendar, ArrowRight, Wheat, ArrowLeft, Clock, CreditCard } from 'lucide-react';
import { createClient } from '@/utils/supabase/server';
import Link from 'next/link';
import { RecordDetailDialog } from '@/components/portal/record-detail-dialog';
import { differenceInDays, format } from 'date-fns';

export const dynamic = 'force-dynamic';

export default async function PortalPage() {
    const portfolio = await getCustomerPortfolio();

    if (!portfolio || portfolio.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6 px-4">
                <div className="p-6 bg-blue-50 rounded-full animate-pulse">
                    <Wheat className="h-16 w-16 text-blue-500" />
                </div>
                <div className="space-y-2">
                     <h2 className="text-2xl font-bold tracking-tight text-slate-900">No Active Stock</h2>
                     <p className="text-slate-500 max-w-[300px] mx-auto">
                        Your account is linked, but no active storage records were found.
                    </p>
                </div>
            </div>
        );
    }

    const totalBagsAllWarehouses = portfolio.reduce((acc, curr) => acc + curr.totalBags, 0);

    // Check Role for Back Button
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    let showDashboardLink = false;
    if (user) {
        const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
        if (profile && (profile.role === 'admin' || profile.role === 'manager')) {
            showDashboardLink = true;
        }
    }

    return (
        <div className="space-y-6 max-w-md mx-auto md:max-w-4xl relative pb-10">
             {showDashboardLink && (
                <div className="absolute top-0 right-0 md:-top-12 md:right-auto md:left-0">
                    <Link href="/" className="inline-flex items-center text-sm text-slate-500 hover:text-blue-600 transition-colors">
                        <ArrowLeft className="mr-1 h-4 w-4" /> Back to Dashboard
                    </Link>
                </div>
            )}
            {/* Mobile-App Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-[2.5rem] p-8 text-white shadow-xl shadow-blue-100 overflow-hidden relative">
                <div className="relative z-10 flex items-start justify-between">
                    <div>
                        <p className="text-blue-100 text-sm font-medium mb-1 uppercase tracking-widest">Global Portfolio</p>
                        <h1 className="text-5xl font-black tracking-tighter">{totalBagsAllWarehouses}</h1>
                        <p className="text-blue-100/80 text-xs mt-2 font-medium">Bags across {portfolio.length} warehouses</p>
                    </div>
                    <div className="p-4 bg-white/10 rounded-3xl backdrop-blur-md border border-white/20">
                        <Package className="h-10 w-10 text-white" />
                    </div>
                </div>
                {/* Decorative circles */}
                <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl" />
                <div className="absolute -top-10 -left-10 w-32 h-32 bg-blue-400/20 rounded-full blur-2xl" />
            </div>

            <div className="flex items-center justify-between px-1">
                <h2 className="text-xl font-black text-slate-900">Your Locations</h2>
                <Badge variant="outline" className="rounded-full px-3 py-1 bg-white shadow-sm border-slate-100 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Live Data
                </Badge>
            </div>

            {/* Warehouse "Wallet" Cards */}
            <div className="grid gap-6 md:grid-cols-2">
                {portfolio.map((wh, idx) => (
                    <div key={idx} className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden hover:shadow-md transition-all duration-300">
                        {/* Card Header */}
                        <div className="p-6 border-b border-slate-50 bg-slate-50/30">
                            <div className="flex justify-between items-start mb-3">
                                <div className="space-y-1">
                                    <h3 className="text-lg font-black text-slate-900 leading-tight">
                                        {wh.warehouseName}
                                    </h3>
                                    <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
                                        <div className="h-4 w-4 rounded-full bg-blue-50 flex items-center justify-center">
                                            <MapPin className="h-2.5 w-2.5 text-blue-500" />
                                        </div>
                                        {wh.warehouseLocation}
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-2xl font-black text-slate-900">{wh.totalBags}</p>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic">Total Bags</p>
                                </div>
                            </div>
                            
                            <div className="flex gap-2">
                                <Badge variant="secondary" className="bg-green-50 text-green-700 hover:bg-green-50 border-green-100 text-[10px] font-bold px-3 py-1 rounded-full flex items-center gap-1">
                                    <CreditCard className="h-3 w-3" /> Paid ₹{wh.totalPaid}
                                </Badge>
                                {wh.totalBilled > wh.totalPaid && (
                                    <Badge variant="outline" className="text-red-600 border-red-100 text-[10px] font-bold px-3 py-1 rounded-full">
                                        Due ₹{wh.totalBilled - wh.totalPaid}
                                    </Badge>
                                )}
                            </div>
                        </div>

                        {/* Recent Items List */}
                        <div className="divide-y divide-slate-50 px-2 pb-2">
                            {wh.records.map((record) => {
                                const age = differenceInDays(new Date(), new Date(record.storage_start_date));
                                const isOverdue = (record.billed - record.paid) > 0;
                                
                                return (
                                    <div key={record.id} className="p-4 flex items-center justify-between hover:bg-slate-50/80 rounded-2xl transition-all group">
                                        <div className="flex items-center gap-4">
                                            <div className="h-12 w-12 rounded-2xl bg-yellow-50 flex items-center justify-center border border-yellow-100 group-hover:scale-110 transition-transform">
                                                <span className="text-xl">🌾</span>
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-slate-900">{record.crops?.name || 'Crop'}</p>
                                                <div className="flex items-center gap-3 mt-0.5">
                                                    <p className="text-[10px] font-medium text-slate-500 flex items-center gap-1">
                                                        <Clock className="h-3 w-3" />
                                                        {age} Days
                                                    </p>
                                                    {isOverdue && (
                                                        <span className="h-1 w-1 rounded-full bg-red-400" />
                                                    )}
                                                    <p className="text-[10px] font-medium text-slate-400 flex items-center gap-1">
                                                        <Calendar className="h-3 w-3" />
                                                        {format(new Date(record.storage_start_date), 'MMM d')}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="text-right">
                                                <p className="text-sm font-black text-slate-900">{record.bags_stored}</p>
                                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest italic">In Stock</p>
                                            </div>
                                            <RecordDetailDialog record={record} trigger={
                                                <button className="h-8 w-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-blue-600 hover:text-white transition-all shadow-sm">
                                                    <ArrowRight className="h-4 w-4" />
                                                </button>
                                            } />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
