'use server';

import { createClient } from '@/utils/supabase/server';
import { getUserWarehouse } from "@/lib/queries";
import { revalidatePath } from 'next/cache';

// Warehouse Actions

export async function updateWarehouseDetails(formData: FormData) {
  const supabase = await createClient();
  const warehouseId = await getUserWarehouse();
  
  if (!warehouseId) {
    throw new Error('Unauthorized');
  }

  const name = formData.get('name') as string;
  const location = formData.get('location') as string;
  const phone = formData.get('phone') as string;
  const email = formData.get('email') as string;
  const capacityStr = formData.get('capacity') as string;
  const capacity = capacityStr ? parseInt(capacityStr) : 0;

  const { error } = await supabase
    .from('warehouses')
    .update({ 
      name, 
      location, 
      phone,
      email,
      capacity_bags: capacity 
    })
    .eq('id', warehouseId);

  if (error) {
    throw new Error('Failed to update warehouse');
  }

  revalidatePath('/settings');
}

// Crop Actions

export async function addCrop(formData: FormData) {
  const supabase = await createClient();
  const warehouseId = await getUserWarehouse();
  
  if (!warehouseId) {
    throw new Error('Unauthorized');
  }

  const name = formData.get('name') as string;
  const rent_price_6m = parseFloat(formData.get('price6m') as string);
  const rent_price_1y = parseFloat(formData.get('price1y') as string);

  const { error } = await supabase.from('crops').insert({
    warehouse_id: warehouseId,
    name,
    rent_price_6m,
    rent_price_1y
  });

  if (error) {
    console.error(error);
    throw new Error('Failed to add crop');
  }

  revalidatePath('/settings');
}

export async function deleteCrop(cropId: string) {
  const supabase = await createClient();
  const warehouseId = await getUserWarehouse();
  
  if (!warehouseId) {
    throw new Error('Unauthorized');
  }

  // Ensure we only delete crops from our warehouse (RLS handles this but good to be explicit/safe)
  const { error } = await supabase
    .from('crops')
    .delete()
    .eq('id', cropId)
    .eq('warehouse_id', warehouseId);

  if (error) {
    throw new Error('Failed to delete crop');
  }

  revalidatePath('/settings');
}

export async function seedDatabase() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  console.log('Starting Heavy Seed...');

  // 1. DELETE ORDER (Child -> Parent)
  await supabase.from('expenses').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('payments').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('storage_records').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('customers').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('warehouse_lots').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('crops').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  
  // 2. CREATE WAREHOUSE (If not exists or use existing)
  let { data: warehouse } = await supabase.from('warehouses').select('id').limit(1).single();
  
  if (!warehouse) {
      const { data: newW } = await supabase.from('warehouses').insert({
          name: 'Main Godown (Heavy)',
          location: 'Vizag Main Hub',
          capacity_bags: 100000
      }).select().single();
      warehouse = newW;
  } else {
      await supabase.from('warehouses').update({
          name: 'Main Godown (Heavy)',
          location: 'Vizag Main Hub',
          capacity_bags: 100000
      }).eq('id', warehouse.id);
  }

  if (!warehouse) throw new Error("Failed to find or create warehouse");

  const warehouseId = warehouse.id;

  // 3. LINK PROFILE
  await supabase.from('profiles').update({ warehouse_id: warehouseId }).eq('id', user.id);

  // 4. CREATE CROPS
  const cropsData = [
    { warehouse_id: warehouseId, name: 'Paddy (Sona)', rent_price_6m: 30, rent_price_1y: 50 },
    { warehouse_id: warehouseId, name: 'Paddy (MTU)', rent_price_6m: 28, rent_price_1y: 48 },
    { warehouse_id: warehouseId, name: 'Red Gram', rent_price_6m: 45, rent_price_1y: 80 },
    { warehouse_id: warehouseId, name: 'Maize', rent_price_6m: 25, rent_price_1y: 45 },
  ];
  const { data: crops } = await supabase.from('crops').insert(cropsData).select();
  if(!crops) throw new Error("Failed to seed crops");

  // 5. CREATE LOTS (100 in bulk)
  const lots = [];
  for(let i=1; i<=50; i++) lots.push({ warehouse_id: warehouseId, name: `A${i}`, capacity: 1000, status: 'Active' });
  for(let i=1; i<=50; i++) lots.push({ warehouse_id: warehouseId, name: `B${i}`, capacity: 1000, status: 'Active' });
  
  const { data: lotData } = await supabase.from('warehouse_lots').insert(lots).select();
  const validLots = lotData || [];

  // 6. CREATE CUSTOMERS (30)
  const firstNames = ['Ramesh', 'Suresh', 'Mahesh', 'Naresh', 'Ganesh', 'Rajesh', 'Satish', 'Venkatesh', 'Anil', 'Sunil'];
  const lastNames = ['Kumar', 'Reddy', 'Rao', 'Yadav', 'Singh', 'Gupta', 'Chowdary', 'Naidu'];
  
  const customers = [];
  for(let i=0; i<30; i++) {
     const name = `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`;
     customers.push({
         warehouse_id: warehouseId,
         name,
         phone: `9${Math.floor(Math.random() * 900000000 + 100000000)}`,
         address: `Village ${Math.floor(Math.random() * 50)}`
     });
  }
  const { data: customerData } = await supabase.from('customers').insert(customers).select();
  const validCustomers = customerData || [];

  // 7. CREATE RECORDS (150)
  const records = [];
  for(let i=0; i<150; i++) {
     const customer = validCustomers[Math.floor(Math.random() * validCustomers.length)];
     const crop = crops[Math.floor(Math.random() * crops.length)];
     const lot = validLots[Math.floor(Math.random() * validLots.length)];
     
     if(!customer || !crop || !lot) continue;

     const bags = Math.floor(Math.random() * 50) + 10;
     const date = new Date();
     date.setDate(date.getDate() - Math.floor(Math.random() * 60)); // Past 60 days

     records.push({
        customer_id: customer.id,
        crop_id: crop.id,
        lot_id: lot.id,
        bags_in: bags,
        bags_stored: bags, // Assuming no outflow yet
        bag_weight: 75, // Default as standard weight removed from crop
        in_date: date.toISOString().split('T')[0],
        estimated_rent: bags * (crop.rent_price_6m || 30),
        status: 'Active'
     });
  }
  
  await supabase.from('storage_records').insert(records);

  console.log('Seeding Complete');
  revalidatePath('/');
  revalidatePath('/settings');
}
