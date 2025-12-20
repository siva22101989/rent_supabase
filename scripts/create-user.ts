
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load env vars
dotenv.config({ path: resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing environment variables');
  process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function main() {
  const email = 'sandeep@gmail.com';
  const password = '9160606633';
  const fullName = 'Sandeep';
  const role = 'owner';
  const warehouseId = '1c5931af-2a22-46d6-927d-3d4eb63ea8b5';

  console.log(`Creating user ${email}...`);

  // 1. Create User in Auth
  const { data: userData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      full_name: fullName,
      role: role
    }
  });

  if (authError) {
    if (authError.message.includes('already registered')) {
      console.log('User already exists in Auth. Proceeding to update profile...');
    } else {
      console.error('Error creating user:', authError.message);
      return;
    }
  }

  const userId = userData?.user?.id || (await supabaseAdmin.from('profiles').select('id').eq('email', email).single()).data?.id;

  if (!userId) {
    console.error('Could not find user ID');
    return;
  }

  console.log(`User ID: ${userId}. Updating profile and assignments...`);

  // 2. Ensure Profile exists and has correct role/warehouse
  const { error: profileError } = await supabaseAdmin
    .from('profiles')
    .upsert({
      id: userId,
      email,
      full_name: fullName,
      role: role,
      warehouse_id: warehouseId,
      updated_at: new Date().toISOString()
    });

  if (profileError) {
    console.error('Error updating profile:', profileError.message);
  } else {
    console.log('Profile updated successfully.');
  }

  // 3. Ensure Warehouse Assignment
  const { error: assignmentError } = await supabaseAdmin
    .from('warehouse_assignments')
    .upsert({
      user_id: userId,
      warehouse_id: warehouseId,
      role: role
    });

  if (assignmentError) {
    console.error('Error adding warehouse assignment:', assignmentError.message);
  } else {
    console.log('Warehouse assignment created successfully.');
  }

  console.log('Done! User is now an owner of Sri Lakshmi WareHouse.');
}

main();
