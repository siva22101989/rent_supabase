import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load env from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = 'sb_secret_N7UND0UgjKTVK-Uodkm0Hg_xSvEMPvz'; // Local service role key

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function setupTestUser(email: string, role: string = 'staff') {
  const password = '123456';

  console.log(`Checking for test user: ${email}...`);

  const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
  
  if (listError) {
    console.error('Error listing users:', listError);
    return;
  }

  const existingUser = users.find(u => u.email === email);
  let targetUserId = existingUser?.id;

  if (existingUser) {
    console.log(`✅ Test user ${email} already exists.`);
  } else {
    console.log(`Creating test user ${email}...`);
    const { data: user, error: createError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: `Test ${role}` }
    });

    if (createError) {
      console.error(`Error creating user ${email}:`, createError);
      return;
    }
    console.log(`✅ Test user ${email} created successfully.`);
    targetUserId = user.user.id;
  }

  // Ensure profile and warehouse assignment
  const { data: warehouse } = await supabase.from('warehouses').select('id').limit(1).single();
  if (warehouse && targetUserId) {
      await supabase.from('profiles').upsert({ 
          id: targetUserId,
          warehouse_id: warehouse.id,
          role: role 
      }, { onConflict: 'id' });
      
      await supabase.from('user_warehouses').upsert({
          user_id: targetUserId,
          warehouse_id: warehouse.id,
          role: role === 'super_admin' ? 'owner' : 'staff'
      }, { onConflict: 'user_id,warehouse_id' });
      
      console.log(`✅ User ${email} (ID: ${targetUserId}) ensured in warehouse ${warehouse.id} as ${role}`);
  }
}

async function main() {
    // Standard test users
    await setupTestUser('siva01@gmail.com', 'super_admin');
    await setupTestUser('nikhilpnkr@gmail.com', 'admin');
    await setupTestUser('admin@test.com', 'super_admin');
    
    // RLS Isolation test users
    const { data: warehouses } = await supabase.from('warehouses').select('id').order('name');
    if (warehouses && warehouses.length >= 2) {
        // Warehouse A user
        await setupTestUser('warehouse-a@test.com', 'admin');
        const userA = (await supabase.auth.admin.listUsers()).data.users.find(u => u.email === 'warehouse-a@test.com');
        if (userA) {
            await supabase.from('profiles').update({ warehouse_id: warehouses[0].id }).eq('id', userA.id);
            await supabase.from('user_warehouses').upsert({ user_id: userA.id, warehouse_id: warehouses[0].id, role: 'owner' });
        }

        // Warehouse B user
        await setupTestUser('warehouse-b@test.com', 'admin');
        const userB = (await supabase.auth.admin.listUsers()).data.users.find(u => u.email === 'warehouse-b@test.com');
        if (userB) {
            await supabase.from('profiles').update({ warehouse_id: warehouses[1].id }).eq('id', userB.id);
            await supabase.from('user_warehouses').upsert({ user_id: userB.id, warehouse_id: warehouses[1].id, role: 'owner' });
        }
    }

    await setupTestUser('superadmin@test.com', 'super_admin');
    await setupTestUser('staff@test.com', 'staff');
}

main().catch(console.error);

