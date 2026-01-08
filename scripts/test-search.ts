import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = 'sb_secret_N7UND0UgjKTVK-Uodkm0Hg_xSvEMPvz'; // Local service role key

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testSearch() {
    const warehouseId = 'a78cab24-de8f-455d-8f9d-e5fcff45d3f9'; // From previous inspect
    const query = 'Rajesh';
    
    console.log(`Testing search for "${query}" in warehouse ${warehouseId}...`);
    
    let dbQuery = supabase
        .from('storage_records')
        .select(`
          id,
          customer:customers!inner(name) 
        `)
        .eq('warehouse_id', warehouseId)
        .is('storage_end_date', null)
        .is('deleted_at', null)
        .gt('bags_stored', 0)
        .ilike('customer.name', `%${query}%`);

    const { data, error } = await dbQuery;

    if (error) {
        console.error('Search Error (customer.name):', error);
        
        console.log('Trying with customers.name...');
        let dbQuery2 = supabase
            .from('storage_records')
            .select(`
              id,
              customer:customers!inner(name) 
            `)
            .eq('warehouse_id', warehouseId)
            .is('storage_end_date', null)
            .is('deleted_at', null)
            .gt('bags_stored', 0)
            .ilike('customers.name', `%${query}%`);
            
        const { data: data2, error: error2 } = await dbQuery2;
        if (error2) {
            console.error('Search Error (customers.name):', error2);
        } else {
            console.log('Search Success (customers.name):', data2?.length, 'results found.');
        }
    } else {
        console.log('Search Success (customer.name):', data?.length, 'results found.');
    }
}

testSearch().catch(console.error);
