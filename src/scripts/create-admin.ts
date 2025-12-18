
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load env vars
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY; // Using Anon Key

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('Missing Supabase URL or Key in .env');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function main() {
    console.log('Creating Admin User...');
    
    // 1. Sign Up User
    const { data: authData, error: authError } = await supabase.auth.signUp({
        email: 'siva01@gmail.com',
        password: '123456',
    });

    if (authError) {
        if (authError.message.includes('already registered')) {
             console.log('User already exists. Attempting login...');
             const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
                email: 'siva01@gmail.com',
                password: '123456',
             });
             
             if (loginError) {
                 console.error('Login failed:', loginError.message);
                 return;
             }
             if (loginData.session) {
                 console.log('Logged in successfully.');
                 // Set session for subsequent requests
                 await supabase.auth.setSession(loginData.session);
                 await listAndSeed(loginData.user.id);
             }
        } else {
            console.error('Sign up failed:', authError.message);
            return;
        }
    } else if (authData.user) {
        console.log('User created:', authData.user.email);
        if (authData.session) {
             console.log('Session active. Seeding data...');
             await listAndSeed(authData.user.id);
        } else {
            console.log('User created but email confirmation required. Cannot seed data automatically.');
            console.log('Please confirm email or enable auto-confirm in Supabase, then run this script again.');
        }
    }
}

async function listAndSeed(userId: string) {
    // Check if data already exists to avoid duplicates if run multiple times
    const { data: existing } = await supabase.from('warehouses').select('id').single();
    if (existing) {
        console.log('Warehouse already exists for this user. Skipping heavy seed.');
        // Optionally we could force seed, but "basic seed data" usually implies initializing.
        // Let's at least ensure they have some crops.
        return;
    }

    console.log('Seeding Basic Data...');

    // 2. Create Warehouse
    const { data: warehouse, error: wError } = await supabase.from('warehouses').insert({
        name: 'Main Godown (Admin)',
        location: 'Admin HQ',
        capacity_bags: 50000
    }).select().single();

    if (wError) {
         console.error('Failed to create warehouse:', wError.message);
         return;
    }
    const warehouseId = warehouse.id;
    console.log('Warehouse created:', warehouseId);

    // 3. Link Profile
    await supabase.from('profiles').update({ warehouse_id: warehouseId }).eq('id', userId);

    // 4. Create Crops
    const cropsData = [
        { warehouse_id: warehouseId, name: 'Paddy (Sona)', standard_bag_weight_kg: 75, rent_price_6m: 30, rent_price_1y: 50 },
        { warehouse_id: warehouseId, name: 'Paddy (MTU)', standard_bag_weight_kg: 75, rent_price_6m: 28, rent_price_1y: 48 },
        { warehouse_id: warehouseId, name: 'Red Gram', standard_bag_weight_kg: 100, rent_price_6m: 45, rent_price_1y: 80 },
    ];
    const { data: crops, error: cError } = await supabase.from('crops').insert(cropsData).select();
    if (cError) console.error('Error seeding crops:', cError.message);
    else console.log(`Seeded ${crops.length} crops.`);

    // 5. Create Lots
    const lots = [];
    for(let i=1; i<=10; i++) lots.push({ warehouse_id: warehouseId, name: `A${i}`, capacity: 1000, status: 'Active' });
    
    const { error: lError } = await supabase.from('warehouse_lots').insert(lots);
    if (lError) console.error('Error seeding lots:', lError.message);
    else console.log('Seeded 10 lots.');

     // 6. Create Customers
    const customers = [
        { warehouse_id: warehouseId, name: 'Ramesh AdminClient', phone: '9999999999', address: 'Plot 1' },
        { warehouse_id: warehouseId, name: 'Suresh AdminClient', phone: '8888888888', address: 'Plot 2' }
    ];
    const { error: custError } = await supabase.from('customers').insert(customers);
    if (custError) console.error('Error seeding customers:', custError.message);
    else console.log('Seeded 2 customers.');

    console.log('Seed Complete!');
}

main().catch(console.error);
