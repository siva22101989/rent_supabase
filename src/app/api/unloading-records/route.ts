import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { getUserWarehouse } from '@/lib/queries/warehouses';

export async function GET() {
    try {
        const supabase = await createClient();
        const warehouseId = await getUserWarehouse();

        const { checkFeatureAccess } = await import('@/lib/subscription-actions');

        if (!warehouseId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { allowed, message } = await checkFeatureAccess(warehouseId, 'allow_api');
        if (!allowed) {
            return NextResponse.json({ error: message || 'API access not available on this plan' }, { status: 403 });
        }

        const { data, error } = await supabase
            .from('unloading_records')
            .select(`
                *,
                customer:customers(name),
                crop:crops(name)
            `)
            .eq('warehouse_id', warehouseId)
            .gt('bags_remaining', 0)
            .order('unload_date', { ascending: false });

        if (error) throw error;

        return NextResponse.json(data);
    } catch (error: any) {
        console.error('Error fetching unloading records:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
