import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!; // For setup
const USER_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

async function main() {
    if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
        console.error("Missing env vars. Ensure .env.local has URL and SERVICE_ROLE_KEY");
        process.exit(1);
    }

    console.log("🔒 Starting RLS Verification...");

    // 1. Setup Client (Admin)
    const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
        auth: { autoRefreshToken: false, persistSession: false }
    });

    // 2. Create Test Users
    const emailA = `rls_test_owner_${Date.now()}@example.com`;
    const emailB = `rls_test_outsider_${Date.now()}@example.com`;
    
    // Cleanup first
    // Note: In a real script we'd be careful, but these are unique test emails.

    console.log(`Creating test users: ${emailA}, ${emailB}`);
    const { data: userA, error: errA } = await adminClient.auth.admin.createUser({ email: emailA, password: 'password123', email_confirm: true });
    const { data: userB, error: errB } = await adminClient.auth.admin.createUser({ email: emailB, password: 'password123', email_confirm: true });

    if (errA || errB || !userA.user || !userB.user) {
        console.error("Failed to create users", errA, errB);
        process.exit(1);
    }

    try {
        // 3. Setup Data
        // Create Warehouse A (Owner: User A)
        const { data: whA, error: whErr } = await adminClient.from('warehouses').insert({
            name: 'RLS Test Warehouse',
            location: 'Secure Area'
        }).select().single();

        if (whErr) throw whErr;

        // Assign User A as Owner
        await adminClient.from('warehouse_assignments').insert({
            warehouse_id: whA.id,
            user_id: userA.user.id,
            role: 'owner'
        });

        // Add a Customer to Warehouse A
        const { data: custA, error: custErr } = await adminClient.from('customers').insert({
            name: 'Sensitive Customer',
            mobile: '1234567890',
            warehouse_id: whA.id
        }).select().single();

        if (custErr) throw custErr;

        console.log("✅ Setup Complete. Warehouse & Customer created.");

        // 4. Verification

        // Context: User A (Owner)
        const clientA = createClient(SUPABASE_URL, USER_KEY, {
            auth: { autoRefreshToken: false, persistSession: false } 
        });
        await clientA.auth.signInWithPassword({ email: emailA, password: 'password123' });

        const { data: dataA } = await clientA.from('customers').select('*').eq('id', custA.id);
        if (dataA && dataA.length === 1) {
            console.log("✅ [PASS] Owner can see their customer.");
        } else {
            console.error("❌ [FAIL] Owner CANNOT see their customer.");
        }

        // Context: User B (Outsider)
        const clientB = createClient(SUPABASE_URL, USER_KEY, {
            auth: { autoRefreshToken: false, persistSession: false } 
        });
        await clientB.auth.signInWithPassword({ email: emailB, password: 'password123' });

        const { data: dataB } = await clientB.from('customers').select('*').eq('id', custA.id);
        if (!dataB || dataB.length === 0) {
            console.log("✅ [PASS] Outsider cannot see Warehouse A customer.");
        } else {
            console.error("❌ [FAIL] Outsider SAW customer data! RLS LEAK DETECTED.");
        }

    } catch (e) {
        console.error("Unexpected error:", e);
    } finally {
        // Cleanup
        console.log("Cleaning up...");
        await adminClient.auth.admin.deleteUser(userA.user.id);
        await adminClient.auth.admin.deleteUser(userB.user.id);
        // Cascading deletes should handle warehouse/customer if set up, otherwise we leave artifacts in dev DB
    }
}

main();
