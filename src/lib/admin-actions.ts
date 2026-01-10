'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';
import * as Sentry from "@sentry/nextjs";
import { getUserWarehouse } from './queries';
import { logError } from '@/lib/error-logger';

const { logger } = Sentry;

async function checkAdminPermissions() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { authorized: false };

    const { data: profile } = await supabase
        .from('profiles')
        .select('role, warehouse_id')
        .eq('id', user.id)
        .single();

    const isAuthorized = profile?.role === 'super_admin' || profile?.role === 'owner';
    return { 
        authorized: isAuthorized, 
        role: profile?.role, 
        warehouseId: profile?.warehouse_id,
        userId: user.id
    };
}

export async function updateUserRole(userId: string, newRole: string) {
    const { authorized, role, warehouseId } = await checkAdminPermissions();
    if (!authorized) {
        return { success: false, message: 'Unauthorized' };
    }

    const supabase = await createClient();

    // If owner, check if the target user is in their warehouse
    if (role === 'owner') {
        const { data: targetProfile } = await supabase
            .from('profiles')
            .select('warehouse_id')
            .eq('id', userId)
            .single();
        
        if (targetProfile?.warehouse_id !== warehouseId) {
            return { success: false, message: 'Unauthorized: User belongs to another warehouse' };
        }
    }

    const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId);

    if (error) {
        logError(error, { operation: 'updateUserRole', metadata: { userId, newRole } });
        return { success: false, message: error.message };
    }

    revalidatePath('/admin');
    return { success: true, message: 'Role updated successfully' };
}

export async function bulkUpdateUserRoles(userIds: string[], newRole: string) {
    const { authorized, role, warehouseId } = await checkAdminPermissions();
    if (!authorized) return { success: false, message: 'Unauthorized' };

    const supabase = await createClient();

    let query = supabase.from('profiles').update({ role: newRole }).in('id', userIds);

    // If owner, restrict to their warehouse
    if (role === 'owner') {
        query = query.eq('warehouse_id', warehouseId);
    }

    const { error } = await query;

    if (error) {
        logError(error, { operation: 'bulkUpdateUserRoles', metadata: { count: userIds.length, newRole } });
        return { success: false, message: error.message };
    }

    revalidatePath('/admin');
    return { success: true, message: `Updated ${userIds.length} users successfully` };
}

export async function bulkDeleteUsers(userIds: string[]) {
    const { authorized, role, warehouseId } = await checkAdminPermissions();
    if (!authorized) return { success: false, message: 'Unauthorized' };

    const supabase = await createClient();

    let query = supabase.from('profiles').delete().in('id', userIds);

    // If owner, restrict to their warehouse
    if (role === 'owner') {
        query = query.eq('warehouse_id', warehouseId);
    }

    const { error } = await query;

    if (error) {
        logError(error, { operation: 'bulkDeleteUsers', metadata: { count: userIds.length } });
        return { success: false, message: error.message };
    }

    revalidatePath('/admin');
    return { success: true, message: `Deleted ${userIds.length} users successfully` };
}

export async function deleteWarehouseAction(warehouseId: string) {
    const { authorized, role } = await checkAdminPermissions();
    if (!authorized || role !== 'super_admin') {
        return { success: false, message: 'Unauthorized: Only super admins can delete warehouses' };
    }

    const supabase = await createClient();
    
    // Potentially complex if there are constraints. 
    // In a real app, we'd probably soft delete or check for dependencies.
    const { error } = await supabase
        .from('warehouses')
        .delete()
        .eq('id', warehouseId);

    if (error) {
        logError(error, { operation: 'deleteWarehouseAction', metadata: { warehouseId } });
        return { success: false, message: error.message };
    }

    revalidatePath('/admin');
    return { success: true, message: 'Warehouse deleted successfully' };
}

export async function updateWarehouseDetails(formData: FormData) {
    const supabase = await createClient();
    const warehouseId = await getUserWarehouse();
    if (!warehouseId) throw new Error('Unauthorized');

    const name = formData.get('name') as string;
    const location = formData.get('location') as string;
    const phone = formData.get('phone') as string;
    const email = formData.get('email') as string;
    const capacityStr = formData.get('capacity') as string;
    const capacity = capacityStr ? parseInt(capacityStr) : undefined;
    const gstNumber = formData.get('gstNumber') as string;

    const updates: any = { name, location, phone, email, gst_number: gstNumber };
    if (capacity !== undefined && !isNaN(capacity)) {
        updates.capacity_bags = capacity;
    }

    const { error } = await supabase
        .from('warehouses')
        .update(updates)
        .eq('id', warehouseId);

    if (error) {
        logError(error, { operation: 'updateWarehouseDetails', metadata: { warehouseId } });
        throw new Error(error.message);
    }

    revalidatePath('/settings');
}

export async function assignWarehousePlan(warehouseId: string, planTier: string) {
    const { authorized, role } = await checkAdminPermissions();
    if (!authorized || role !== 'super_admin') {
        return { success: false, message: 'Unauthorized: Only super admins can assign plans' };
    }

    const supabase = await createClient();

    // 1. Get the plan details by tier
    const { data: plan, error: planError } = await supabase
        .from('plans')
        .select('id')
        .eq('tier', planTier)
        .single();

    if (planError || !plan) {
        return { success: false, message: 'Invalid plan tier' };
    }

    // 2. Upsert the subscription
    const { error: subError } = await supabase
        .from('subscriptions')
        .upsert({
            warehouse_id: warehouseId,
            plan_id: plan.id,
            status: 'active',
            updated_at: new Date().toISOString()
        }, { onConflict: 'warehouse_id' });

    if (subError) {
        logError(subError, { operation: 'assignWarehousePlan', metadata: { warehouseId, planTier } });
        return { success: false, message: subError.message };
    }

    revalidatePath('/admin');
    return { success: true, message: `Plan upgraded to ${planTier.toUpperCase()} successfully` };
}


export async function addCrop(formData: FormData) {
    const supabase = await createClient();
    const warehouseId = await getUserWarehouse();
    
    if (!warehouseId) throw new Error('Warehouse not found');

    const name = formData.get('name') as string;
    const rentPrice6m = parseFloat(formData.get('price6m') as string);
    const rentPrice1y = parseFloat(formData.get('price1y') as string);

    if (!name || isNaN(rentPrice6m) || isNaN(rentPrice1y)) {
        throw new Error('Invalid crop data');
    }

    const { error } = await supabase.from('crops').insert({
        warehouse_id: warehouseId,
        name,
        rent_price_6m: rentPrice6m,
        rent_price_1y: rentPrice1y
    });

    if (error) {
        logError(error, { operation: 'addCrop', metadata: { warehouseId, name } });
        throw new Error('Failed to add crop');
    }

    revalidatePath('/settings');
    revalidatePath('/settings/lots');
}

