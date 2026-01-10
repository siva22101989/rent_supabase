import { PrintableLabelSheet } from '@/components/storage/printable-label-sheet';
import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Printer } from 'lucide-react';
import Link from 'next/link';
import { PrintHeader } from './print-header';

export const dynamic = 'force-dynamic';

// Helper to fetch multiple records
async function getRecordsByIds(ids: string[]) {
    const supabase = await createClient();
    
    // Using Supabase directly for bulk fetch logic not in queries.ts yet
    const { data: records } = await supabase
        .from('storage_records')
        .select(`
            *,
            customer:customers(name, phone)
        `)
        .in('id', ids);

    if (!records) return [];

    return records.map(r => ({
        ...r,
        storageStartDate: r.storage_start_date,
        storageEndDate: r.storage_end_date,
        bagsStored: r.bags_stored,
        commodityDescription: r.commodity_description,
        recordNumber: r.record_id,
        // map other fields as needed to match StorageRecord type
        inflowType: r.inflow_type,
        bagsIn: r.bags_in,
        bagsOut: r.bags_out,
        totalRentBilled: r.total_rent_billed,
        hamaliRate: r.hamali_rate,
        hamaliPayable: r.hamali_payable,
        warehouseId: r.warehouse_id,
        customerId: r.customer_id
    }));
}

async function getWarehouseDetails() {
    // Ideally fetch from DB, for now hardcoded or fetched from single record's context
    // Let's fetch the current user's warehouse
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { name: 'Warehouse' };

    const { data: userWarehouse } = await supabase
        .from('user_warehouses')
        .select('warehouse:warehouses(name)')
        .eq('user_id', user.id)
        .single();
        
    return { name: (userWarehouse?.warehouse as any)?.name || 'Warehouse' };
}

export default async function PrintLabelsPage({ 
    searchParams 
}: { 
    searchParams: Promise<{ ids?: string }> 
}) {
    const resolvedParams = await searchParams;
    const ids = resolvedParams.ids?.split(',') || [];

    if (ids.length === 0) {
        return (
            <div className="p-8 text-center">
                <h1 className="text-xl font-bold text-destructive">No records selected</h1>
                <Link href="/storage">
                    <Button variant="outline" className="mt-4">Back to Storage</Button>
                </Link>
            </div>
        );
    }

    const records = await getRecordsByIds(ids);
    const warehouse = await getWarehouseDetails();

    return (
        <div className="min-h-screen bg-gray-100 print:bg-white">
            <PrintHeader count={records.length} />

            <div className="max-w-[210mm] mx-auto bg-white min-h-screen shadow-lg print:shadow-none print:w-full">
                <PrintableLabelSheet 
                    records={records as any} 
                    warehouseName={warehouse.name} 
                />
            </div>
        </div>
    );
}
