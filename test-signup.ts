
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'NoKeyFound'; // Ensure it doesn't crash on init if missing, though it will fail auth.

if (supabaseKey === 'NoKeyFound') {
    console.error("Missing Anon Key in env");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
    const email = `test_autolink_${Date.now()}@example.com`;
    const phone = '9998887776';
    const password = 'password123';

    console.log(`Simulating Signup for: ${email} with Phone: ${phone}`);

    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: {
                full_name: 'AutoLink Tester',
                role: 'customer',
                phone_number: phone
            }
        }
    });

    if (error) {
        console.error("Signup Failed:", error.message);
    } else {
        console.log("Signup Success! User ID:", data.user?.id);
    }
}

main();
