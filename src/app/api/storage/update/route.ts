import { NextRequest, NextResponse } from 'next/server';
import { updateStorageRecordSimple } from '@/lib/actions/storage/records';

export async function POST(request: NextRequest) {
    try {
        const { getUserWarehouse } = await import('@/lib/queries/warehouses');
        const { checkFeatureAccess } = await import('@/lib/subscription-actions');
        
        const warehouseId = await getUserWarehouse();
        if (!warehouseId) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }
        
        const { allowed, message } = await checkFeatureAccess(warehouseId, 'allow_api');
        if (!allowed) {
            return NextResponse.json({ success: false, message: message || 'API access not allowed' }, { status: 403 });
        }

        const body = await request.json();
        const { id, ...formData } = body;

        const result = await updateStorageRecordSimple(id, formData);
        
        return NextResponse.json(result);
    } catch (error) {
        console.error('API Error:', error);
        return NextResponse.json(
            { success: false, message: 'Internal server error' },
            { status: 500 }
        );
    }
}
