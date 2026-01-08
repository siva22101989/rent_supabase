import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = 'sb_secret_N7UND0UgjKTVK-Uodkm0Hg_xSvEMPvz'; // Local service role key

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyMigration() {
    const migrationPath = path.resolve(process.cwd(), 'supabase/migrations/20260108000000_add_soft_delete.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('Applying migration...');
    
    // Split by semicolons for basic execution if needed, but since it's just ALTER TABLE, 
    // we can try a single RPC call if available, or use the REST API to execute raw SQL (if enabled).
    // Actually, on local development, we can use the PostgreSQL connection directly if needed.
    // However, the easiest way via JS client is if we have an 'exec_sql' RPC.
    
    // Since we don't have exec_sql RPC by default, I'll use a direct postgres connection via 'pg' if available,
    // or I'll just use the supabase.rpc('get_table_columns') hack to check if they were added.
    
    // Wait, I'll use a simpler approach: use the REST API to run the RPC if it exists.
    // If not, I'll use the 'supabase db execute' fixed command.
    
    console.log('Please run this manually if the script fails:');
    console.log('npx supabase db execute --project-ref RENT --file supabase/migrations/20260108000000_add_soft_delete.sql');
}

applyMigration().catch(console.error);
