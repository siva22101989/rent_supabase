import { NextRequest, NextResponse } from 'next/server';
import { updateStorageRecordSimple } from '@/lib/actions';

export async function POST(request: NextRequest) {
    try {
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
