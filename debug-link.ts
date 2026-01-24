
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseKey) {
    console.error("No Supabase Key found.");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
    console.log("--- Debugging Linkage ---");

    // 1. Find User ID for email via Profiles (assuming public access or role allows)
    // If service role is missing, use anon key but we might hit RLS.
    // However, in 'tsx' context on server, we might desire service key.
    // If user doesn't have service key, we can try to find profile by email if RLS allows.
    // If this fails, we can't easily find the ID.
    
    const { data: profiles, error: pErr } = await supabase
        .from('profiles')
        .select('id, email, full_name') // Assuming email is in profiles? Or we just select all and filter.
        .eq('email', 'nikhilpnkr@gmail.com')
        .single();
        
    let adminUserId = profiles?.id;

    if (profiles) {
        console.log(`User [nikhilpnkr@gmail.com] ID: ${profiles.id}`);
    } else {
        console.log("User [nikhilpnkr@gmail.com] NOT FOUND in Profiles (might be RLS hidden).");
        if (pErr) console.error("Profiles Error:", pErr);
    }

    // 2. Find Customer Record
    const { data: customers, error: _cErr } = await supabase
        .from('customers')
        .select('id, name, phone, linked_user_id')
        .eq('phone', '9121414605');
    
    if (customers && customers.length > 0) {
        customers.forEach(c => {
            console.log(`Customer [${c.name}] Phone: ${c.phone}`);
            console.log(`  -> current linked_user_id: ${c.linked_user_id}`);
            
            if (adminUserId) {
                const match = c.linked_user_id === adminUserId;
                console.log(`  -> Matches Admin? ${match ? 'YES ✅' : 'NO ❌'}`);
            }
        });
    } else {
        console.log("Customer with phone 9121414605 NOT FOUND.");
    }
}

main();
