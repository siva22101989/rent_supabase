
import { getCustomerPortfolio } from '@/lib/portal-queries';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Package, MapPin, Calendar, ArrowRight, Wheat, ArrowLeft } from 'lucide-react';
import { createClient } from '@/utils/supabase/server';
import Link from 'next/link';

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
        <div className="space-y-6 max-w-md mx-auto md:max-w-4xl relative">
             {showDashboardLink && (
                <div className="absolute top-0 right-0 md:-top-12 md:right-auto md:left-0">
                    <Link href="/" className="inline-flex items-center text-sm text-slate-500 hover:text-blue-600 transition-colors">
                        <ArrowLeft className="mr-1 h-4 w-4" /> Back to Dashboard
                    </Link>
                </div>
            )}
            {/* Mobile-App Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-3xl p-6 text-white shadow-lg shadow-blue-200">
                <div className="flex items-start justify-between">
                    <div>
                        <p className="text-blue-100 text-sm font-medium mb-1">Total Stock</p>
                        <h1 className="text-4xl font-bold tracking-tight">{totalBagsAllWarehouses}</h1>
                        <p className="text-blue-100 text-xs mt-2 opacity-80">Across {portfolio.length} locations</p>
                    </div>
                    <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
                        <Package className="h-8 w-8 text-white" />
                    </div>
                </div>
            </div>

            <h2 className="text-lg font-semibold text-slate-900 px-1">Your Warehouses</h2>

            {/* Warehouse "Wallet" Cards */}
            <div className="grid gap-4 md:grid-cols-2">
                {portfolio.map((wh, idx) => (
                    <div key={idx} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                        {/* Card Header */}
                        <div className="p-5 border-b border-slate-50 bg-slate-50/50">
                            <div className="flex justify-between items-start mb-2">
                                <div className="space-y-1">
                                    <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                        <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                                        {wh.warehouseName}
                                    </h3>
                                    <div className="flex items-center gap-1 text-xs text-slate-500">
                                        <MapPin className="h-3 w-3" />
                                        {wh.warehouseLocation}
                                    </div>
                                </div>
                                <Badge variant="secondary" className="bg-white hover:bg-white text-slate-700 font-mono border-slate-200">
                                    {wh.totalBags} Bags
                                </Badge>
                            </div>
                        </div>

                        {/* Recent Items List */}
                        <div className="divide-y divide-slate-50">
                            {wh.records.map((record) => (
                                <div key={record.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-full bg-yellow-50 flex items-center justify-center border border-yellow-100">
                                            <span className="text-lg">🌾</span>
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold text-slate-900">{record.crops?.name || 'Crop'}</p>
                                            <p className="text-xs text-slate-500 flex items-center gap-1">
                                                <Calendar className="h-3 w-3" />
                                                {new Date(record.storage_start_date).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-bold text-slate-900">{record.bags_stored}</p>
                                        <p className="text-[10px] text-slate-400 uppercase tracking-wider">Bags</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                        
                        <div className="p-4 bg-slate-50/50">
                            <button className="w-full text-center text-xs font-medium text-blue-600 hover:text-blue-700 flex items-center justify-center gap-1">
                                View Full History <ArrowRight className="h-3 w-3" />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
