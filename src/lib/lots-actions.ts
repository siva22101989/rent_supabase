'use server';

import { createClient } from '@/utils/supabase/server';
import { getUserWarehouse } from "@/lib/queries";
import { revalidatePath } from 'next/cache';

export async function addLot(formData: FormData) {
  const supabase = await createClient();
  const warehouseId = await getUserWarehouse();
  
  if (!warehouseId) throw new Error('Unauthorized');

  const name = formData.get('name') as string;
  const capacityStr = formData.get('capacity') as string;
  const capacity = capacityStr ? parseInt(capacityStr) : 1000;

  const { error } = await supabase.from('warehouse_lots').insert({
    warehouse_id: warehouseId,
    name,
    capacity,
    status: 'Active'
  });

  if (error) throw new Error('Failed to add lot');
  revalidatePath('/settings/lots');
}

export async function bulkAddLots(formData: FormData) {
    const supabase = await createClient();
    const warehouseId = await getUserWarehouse();
    
    if (!warehouseId) throw new Error('Unauthorized');
  
    const prefix = formData.get('prefix') as string;
    const start = parseInt(formData.get('start') as string);
    const end = parseInt(formData.get('end') as string);
    const capacityStr = formData.get('capacity') as string;
    const capacity = capacityStr ? parseInt(capacityStr) : 1000;
  
    if (isNaN(start) || isNaN(end) || start > end) {
        throw new Error('Invalid range');
    }

    const lots = [];
    for (let i = start; i <= end; i++) {
        lots.push({
            warehouse_id: warehouseId,
            name: `${prefix}${i}`,
            capacity,
            status: 'Active'
        });
    }

    const { error } = await supabase.from('warehouse_lots').insert(lots);
  
    if (error) {
        console.error(error);
        throw new Error('Failed to bulk add lots');
    }
  
    revalidatePath('/settings/lots');
}

export async function deleteLot(id: string) {
    const supabase = await createClient();
    const warehouseId = await getUserWarehouse();
    if (!warehouseId) throw new Error('Unauthorized');

    const { error } = await supabase.from('warehouse_lots').delete().eq('id', id).eq('warehouse_id', warehouseId);
    if (error) throw new Error('Failed to delete lot');
    revalidatePath('/settings/lots');
}

export async function addLotsFromList(formData: FormData) {
    const supabase = await createClient();
    const warehouseId = await getUserWarehouse();
    if (!warehouseId) throw new Error('Unauthorized');
  
    const listContent = formData.get('list_content') as string;
    const capacityStr = formData.get('capacity') as string;
    const capacity = capacityStr ? parseInt(capacityStr) : 1000;
  
    if (!listContent) return;

    // Split by comma or newline, trim, and filter empty
    const names = listContent.split(/[\n,]+/).map(s => s.trim()).filter(Boolean);
    
    // Deduplicate names within the input
    const uniqueNames = Array.from(new Set(names));

    if (uniqueNames.length === 0) return;

    const lots = uniqueNames.map(name => ({
        warehouse_id: warehouseId,
        name,
        capacity,
        status: 'Active'
    }));

    const { error } = await supabase.from('warehouse_lots').insert(lots);
  
    if (error) {
        console.error(error);
        throw new Error('Failed to add lots from list');
    }
  
    revalidatePath('/settings/lots');
}
