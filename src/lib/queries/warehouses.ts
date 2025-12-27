import { createClient } from '@/utils/supabase/server';
import { cache } from 'react';
import type { UserWarehouse } from '@/lib/definitions';

// Helper to get current user's warehouse
export const getUserWarehouse = cache(async () => {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('warehouse_id')
    .eq('id', user.id)
    .single();

  return profile?.warehouse_id;
});

export const getCurrentUserRole = cache(async () => {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  return profile?.role;
});

export const hasCustomerProfile = cache(async () => {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { count } = await supabase
        .from('customers')
        .select('*', { count: 'exact', head: true })
        .eq('linked_user_id', user.id);
    
    return (count || 0) > 0;
});

export const getUserWarehouses = cache(async (): Promise<UserWarehouse[]> => {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data } = await supabase
        .from('warehouse_assignments')
        .select(`
            id,
            user_id,
            warehouse_id,
            role,
            warehouse:warehouses (
                id,
                name,
                location,
                capacity_bags,
                created_at
            )
        `)
        .eq('user_id', user.id);
        
    if (!data) return [];

    return data.map((item: any) => ({
        id: item.id,
        userId: item.user_id,
        warehouseId: item.warehouse_id,
        role: item.role,
        warehouse: Array.isArray(item.warehouse) ? item.warehouse[0] : item.warehouse
    }));
});

export const getWarehouseDetails = cache(async () => {
  const supabase = await createClient();
  const warehouseId = await getUserWarehouse();
  if (!warehouseId) return null;

  const { data } = await supabase
    .from('warehouses')
    .select('*')
    .eq('id', warehouseId)
    .single();

  return data;
});

export const getAvailableCrops = cache(async () => {
    const supabase = await createClient();
    const warehouseId = await getUserWarehouse();
    if (!warehouseId) return [];

    const { data } = await supabase.from('crops').select('*').eq('warehouse_id', warehouseId).order('name');
    return data || [];
});

export const getAvailableLots = cache(async () => {
    const supabase = await createClient();
    const warehouseId = await getUserWarehouse();
    if (!warehouseId) return [];

    const { data } = await supabase.from('warehouse_lots').select('*').eq('warehouse_id', warehouseId).order('name');
    return data || [];
});

export async function getTeamMembers() {
    const supabase = await createClient();
    const warehouseId = await getUserWarehouse();
    if (!warehouseId) return [];

    const { data: profiles, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('warehouse_id', warehouseId)
        .neq('role', 'customer')
        .order('created_at', { ascending: false });

    if (error) return [];
    
    return profiles.map((p: any) => ({
        id: p.id,
        email: p.email,
        fullName: p.full_name,
        role: p.role,
        createdAt: new Date(p.created_at),
    }));
}

export async function getMemberAssignments(userId: string) {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('warehouse_assignments')
        .select('warehouse_id, role')
        .eq('user_id', userId);
    
    if (error) return [];
    return data;
}
