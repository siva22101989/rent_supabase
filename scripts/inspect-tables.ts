import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = 'sb_secret_N7UND0UgjKTVK-Uodkm0Hg_xSvEMPvz'; // Local service role key

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function inspectTables() {
    const tables = ['storage_records', 'customers', 'withdrawal_transactions', 'payments'];
    for (const table_name of tables) {
        console.log(`--- Table: ${table_name} ---`);
        const { data: columnsRaw } = await supabase.from(table_name).select('*').limit(1);
        if (columnsRaw && columnsRaw.length > 0) {
            console.log(Object.keys(columnsRaw[0]).join(', '));
        } else {
            console.log('(No records found)');
        }
        console.log('');
    }
}

inspectTables().catch(console.error);
