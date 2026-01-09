import { createClient } from '@/utils/supabase/server';
import { getUserWarehouse } from '@/lib/data';

/**
 * Generates a short code for the warehouse.
 * Example: Bangalore Main -> BLMN
 * Example: Warehouse 1 -> WH1
 */
export function generateWarehouseCode(name: string): string {
    if (!name) return 'WH';
    
    // Remove non-alphanumeric chars
    const cleanName = name.replace(/[^a-zA-Z0-9 ]/g, '').toUpperCase();
    const words = cleanName.split(' ').filter(w => w.length > 0);
    
    if (words.length === 0) return 'WH';

    if (words.length === 1) {
        return words[0].substring(0, 4);
    }
    
    // Take first 2 letters of first 2 words
    return (words[0].substring(0, 2) + words[1].substring(0, 2));
}

export function formatInvoiceNumber(prefix: string, type: 'inflow' | 'outflow', value: number): string {
    const typeCode = type === 'inflow' ? 'IN' : 'OUT';
    const numberPart = 1000 + (value || 0);
    return `${prefix}-${typeCode}-${numberPart}`;
}



export async function getNextInvoiceNumber(type: 'inflow' | 'outflow'): Promise<string> {
    const supabase = await createClient();
    const warehouseId = await getUserWarehouse();

    if (!warehouseId) {
        console.error('getNextInvoiceNumber: No warehouse ID found');
        throw new Error("No warehouse assigned to user");
    }

    console.log(`Generating ${type} invoice number for warehouse: ${warehouseId}`);

    // Call the thread-safe database function
    const { data: invoiceNumber, error } = await supabase.rpc('generate_invoice_number', {
        p_warehouse_id: warehouseId,
        p_type: type
    });

    if (error) {
        console.error('Error generating invoice number:', {
            error: error,
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code,
            warehouseId,
            type
        });
        throw new Error(`Failed to generate ${type} invoice number: ${error.message || JSON.stringify(error)}`);
    }

    console.log(`Generated invoice number: ${invoiceNumber}`);
    return invoiceNumber;
}

