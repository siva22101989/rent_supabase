import { createClient } from '@/utils/supabase/server';
import { getUserWarehouse } from '@/lib/data';

/**
 * Generates a short code for the warehouse.
 * Example: "Bangalore Main" -> "BLMN"
 * Example: "Warehouse 1" -> "WH1"
 */
function generateWarehouseCode(name: string): string {
    if (!name) return 'WH';
    
    // Remove non-alphanumeric chars
    const cleanName = name.replace(/[^a-zA-Z0-9 ]/g, '').toUpperCase();
    const words = cleanName.split(' ').filter(w => w.length > 0);
    
    if (words.length === 1) {
        return words[0].substring(0, 4);
    }
    
    // Take first 2 letters of first 2 words
    return (words[0].substring(0, 2) + words[1].substring(0, 2));
}

export async function getNextInvoiceNumber(type: 'inflow' | 'outflow'): Promise<string> {
    const supabase = await createClient();
    const warehouseId = await getUserWarehouse();

    if (!warehouseId) {
        throw new Error("No warehouse assigned to user");
    }

    // 1. Get Warehouse Name for Prefix
    const { data: warehouse } = await supabase
        .from('warehouses')
        .select('name')
        .eq('id', warehouseId)
        .single();
        
    const prefix = generateWarehouseCode(warehouse?.name || 'WH');
    const typeCode = type === 'inflow' ? 'IN' : 'OUT';

    // 2. Call Database Function to Increment Sequence
    const { data: nextVal, error } = await supabase.rpc('get_next_sequence_value', {
        p_warehouse_id: warehouseId,
        p_type: type
    });

    if (error) {
        console.error('Error generating sequence:', error);
        throw new Error(`Failed to generate ${type} sequence`);
    }

    // 3. Format: [WH]-[TYPE]-[1000 + val]
    // Starting from 1001 looks more professional than 1
    const numberPart = 1000 + (nextVal || 0);

    return `${prefix}-${typeCode}-${numberPart}`;
}
