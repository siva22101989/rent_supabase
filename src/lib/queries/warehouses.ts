import { createClient } from '@/utils/supabase/server';
import { cache } from 'react';
import type { UserWarehouse } from '@/lib/definitions';
import { getAuthUser } from './auth';
import { Database } from '@/types/supabase';

type Profiles = Database['public']['Tables']['profiles']['Row'];
type WarehouseAssignments = Database['public']['Tables']['warehouse_assignments']['Row'];


// Helper to get current user's warehouse
// Helper to get current user's warehouse
export const getUserWarehouse = cache(async () => {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  // 1. Try Metadata (Fastest)
  const metaWarehouseId = user.user_metadata?.warehouse_id;
  if (metaWarehouseId) return metaWarehouseId;

  // 2. DB Fallback (and Heal)
  const { data: profile } = await supabase
    .from('profiles')
    .select('warehouse_id')
    .eq('id', user.id)
    .single();

  if (profile?.warehouse_id) {
     // Optional: Heal metadata here if we had write access context, but for query just return
     return profile.warehouse_id;
  }
  
  return null;
});

export const getCurrentUserRole = cache(async () => {
  const supabase = await createClient();
  const user = await getAuthUser();
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
    const user = await getAuthUser();
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

    const { data } = await supabase.from('warehouse_lots').select('*').eq('warehouse_id', warehouseId).is('deleted_at', null).order('name');
    return data || [];
});

export const getTeamMembers = cache(async () => {
    const supabase = await createClient();
    const userRole = await getCurrentUserRole();
    const warehouseId = await getUserWarehouse();
    
    // Debug logging removed for production
    
    if (userRole === 'super_admin') {
         const { data: allProfiles, error } = await supabase
            .from('profiles')
            .select('id, email, full_name, role, created_at')
            .neq('role', 'customer')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('[getTeamMembers] SuperAdmin Error:', error);
            return [];
        }

        return allProfiles.map((p) => ({
            id: p.id,
            email: p.email!,
            fullName: p.full_name!,
            role: p.role!,
            createdAt: p.created_at ? new Date(p.created_at) : new Date(),
        }));
    }

    if (!warehouseId) return [];

    const { data, error } = await supabase
        .from('warehouse_assignments')
        .select(`
            role,
            profiles (
                id,
                email,
                full_name,
                role,
                created_at
            )
        `)
        .eq('warehouse_id', warehouseId);

    if (error) {
        console.error('[getTeamMembers] Error:', error);
        return [];
    }

    // console.log('[getTeamMembers] Raw data count:', data?.length);
    
    const members = data
        .map((item: any) => {
             const p = item.profiles;
             if (!p) return null;
             
             // Filter out customers from team list (if they somehow got assigned)
             if (p.role === 'customer') return null;

             return {
                id: p.id,
                email: p.email,
                fullName: p.full_name,
                role: item.role || p.role, // Use assignment role preferred
                createdAt: new Date(p.created_at),
             };
        })
        .filter(Boolean); // Remove nulls

    // Debug logging removed for production

    // Sort by newest first
    return members.sort((a: any, b: any) => b.createdAt.getTime() - a.createdAt.getTime());
});

export async function getMemberAssignments(userId: string) {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('warehouse_assignments')
        .select('warehouse_id, role')
        .eq('user_id', userId);
    
    if (error) return [];
    return data;
}
