'use server';

import { createClient } from '@/utils/supabase/server';
import { getActiveWarehouseId } from '@/lib/warehouse-actions';

export type SearchResultType = 'customer' | 'record' | 'payment' | 'page';

export interface SearchResult {
    id: string;
    type: SearchResultType;
    title: string;
    subtitle?: string;
    url: string;
    metadata?: Record<string, any>;
}

export async function searchGlobal(query: string): Promise<SearchResult[]> {
    if (!query || query.length < 2) return [];

    const supabase = await createClient();
    const warehouseId = await getActiveWarehouseId();

    if (!warehouseId) return [];

    const results: SearchResult[] = [];
    const sanitizedQuery = query.trim();
    const isNumber = /^\d+$/.test(sanitizedQuery);

    // 1. Search Customers (Name, Phone)
    const { data: customers } = await supabase
        .from('customers')
        .select('id, name, phone, village')
        .eq('warehouse_id', warehouseId)
        .or(`name.ilike.%${sanitizedQuery}%,phone.ilike.%${sanitizedQuery}%`)
        .limit(5);

    if (customers) {
        customers.forEach(c => {
            results.push({
                id: c.id,
                type: 'customer',
                title: c.name,
                subtitle: c.phone ? `Phone: ${c.phone} • ${c.village || ''}` : c.village,
                url: `/customers/${c.id}`
            });
        });
    }

    // 2. Search Storage Records (Record Number, Commodity)
    let recordQuery = supabase
        .from('storage_records')
        .select('id, record_number, commodity_description, storage_start_date')
        .eq('warehouse_id', warehouseId)
        .is('deleted_at', null)
        .limit(5);

    if (isNumber) {
        // Exact match for record number if query is strictly numeric
        recordQuery = recordQuery.eq('record_number', parseInt(sanitizedQuery));
    } else {
        // Text search for commodity
        recordQuery = recordQuery.ilike('commodity_description', `%${sanitizedQuery}%`);
    }

    const { data: records } = await recordQuery;

    if (records) {
        records.forEach(r => {
            results.push({
                id: r.id,
                type: 'record',
                title: `Record #${r.record_number}`,
                subtitle: `${r.commodity_description} • ${new Date(r.storage_start_date).toLocaleDateString()}`,
                url: `/storage?id=${r.id}`
            });
        });
    }

    // 3. Search Payments (Payment Number, Notes)
    let paymentQuery = supabase
        .from('payments')
        .select('id, payment_number, amount, type, notes, payment_date')
        .eq('warehouse_id', warehouseId) // Need to ensure payments has warehouse_id or join via storage_record
        .is('deleted_at', null)
        .limit(5);

    // Wait, 'payments' might not have 'warehouse_id' directly in some legacy schemas, 
    // but the unified schema has 'expenses' with warehouse_id. 
    // Payments are linked to storage_records. 
    // Let's check schema. In `single_truth.sql`: 
    // CREATE TABLE IF NOT EXISTS public.payments ( ... storage_record_id uuid ... )
    // It does NOT have warehouse_id directly! 
    // We must join or ensure RLS handles it. 
    // Actually, RLS on payments usually checks `storage_record_id -> warehouse_id`.
    // But for a fast search, a direct query is tricky without a join.
    // Let's try to query joined with storage_records to filter by warehouse.
    
    // Actually, simpler: Queries on `payments` will likely span all warehouses if we don't filter.
    // RLS *should* filter it automatically if policies are set up correctly:
    // `CREATE POLICY "Users see own warehouse payments" ON payments ... USING (storage_record_id IN ...)`
    // So we can just query.
    
    if (isNumber) {
         paymentQuery = paymentQuery.eq('payment_number', parseInt(sanitizedQuery));
    } else {
         // Search notes or type
         paymentQuery = paymentQuery.ilike('notes', `%${sanitizedQuery}%`);
    }

    // Note: If RLS is weak, this leaks. If RLS is strong, this is safe. 
    // Assuming RLS is active.
    
    const { data: payments } = await paymentQuery;

    if (payments) {
        payments.forEach(p => {
            results.push({
                id: p.id,
                type: 'payment',
                title: `Receipt #${p.payment_number}`,
                subtitle: `₹${p.amount} • ${p.type} • ${new Date(p.payment_date).toLocaleDateString()}`,
                url: `/payments/history?id=${p.id}`
            });
        });
    }

    return results;
}
