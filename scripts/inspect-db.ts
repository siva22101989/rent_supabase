import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = 'sb_secret_N7UND0UgjKTVK-Uodkm0Hg_xSvEMPvz'; // Local service role key

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function inspect() {
    console.log('--- Inspecting Database State ---');
    
    // Check admin@test.com
    const { data: { users } } = await supabase.auth.admin.listUsers();
    const admin = users.find(u => u.email === 'admin@test.com');
    console.log('Admin User ID:', admin?.id);
    
    if (admin) {
        const { data: profile } = await supabase.from('profiles').select('*').eq('id', admin.id).single();
        console.log('Admin Profile Warehouse ID:', profile?.warehouse_id);
    }
    
    // Check Warehouses
    const { data: warehouses } = await supabase.from('warehouses').select('*');
    console.log('Warehouses:', warehouses?.map(w => ({ id: w.id, name: w.name })));
    
    // Check Customers count per warehouse
    for (const w of warehouses || []) {
        const { count } = await supabase.from('customers').select('*', { count: 'exact', head: true }).eq('warehouse_id', w.id);
        console.log(`Warehouse "${w.name}" (${w.id}) has ${count} customers.`);
        
        if (count && count > 0) {
            const { data: sampleCustomer } = await supabase.from('customers').select('name').eq('warehouse_id', w.id).limit(1).single();
            console.log(`Sample customer in "${w.name}": ${sampleCustomer?.name}`);
        }
    }
    
    // Check Columns for critical tables
    const tables = ['storage_records', 'customers', 'withdrawal_transactions', 'payments'];
    for (const table_name of tables) {
        const { data: columnsRaw } = await supabase.from(table_name).select('*').limit(1);
        if (columnsRaw && columnsRaw.length > 0) {
            console.log(`Columns in ${table_name}:`, JSON.stringify(Object.keys(columnsRaw[0])));
        } else {
            console.log(`No records in ${table_name} to check columns.`);
        }
    }
}

inspect().catch(console.error);
