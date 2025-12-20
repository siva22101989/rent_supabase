'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';
import * as Sentry from "@sentry/nextjs";
import { getUserWarehouse } from './queries';

const { logger } = Sentry;

async function checkSuperAdmin() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

    return profile?.role === 'super_admin';
}

export async function updateUserRole(userId: string, newRole: string) {
    if (!(await checkSuperAdmin())) {
        return { success: false, message: 'Unauthorized' };
    }

    const supabase = await createClient();
    const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId);

    if (error) {
        Sentry.captureException(error);
        return { success: false, message: error.message };
    }

    revalidatePath('/admin');
    return { success: true, message: 'Role updated successfully' };
}

export async function deleteWarehouseAction(warehouseId: string) {
    if (!(await checkSuperAdmin())) {
        return { success: false, message: 'Unauthorized' };
    }

    const supabase = await createClient();
    
    // Potentially complex if there are constraints. 
    // In a real app, we'd probably soft delete or check for dependencies.
    const { error } = await supabase
        .from('warehouses')
        .delete()
        .eq('id', warehouseId);

    if (error) {
        Sentry.captureException(error);
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

    const updates: any = { name, location, phone, email };
    if (capacity !== undefined && !isNaN(capacity)) {
        updates.capacity_bags = capacity;
    }

    const { error } = await supabase
        .from('warehouses')
        .update(updates)
        .eq('id', warehouseId);

    if (error) {
        Sentry.captureException(error);
        throw new Error(error.message);
    }

    revalidatePath('/settings');
}

export async function superAdminUpdateWarehouse(warehouseId: string, updates: any) {
    if (!(await checkSuperAdmin())) {
        return { success: false, message: 'Unauthorized' };
    }

    const supabase = await createClient();
    const { error } = await supabase
        .from('warehouses')
        .update(updates)
        .eq('id', warehouseId);

    if (error) {
        Sentry.captureException(error);
        return { success: false, message: error.message };
    }

    revalidatePath('/admin');
    return { success: true, message: 'Warehouse updated successfully' };
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
        Sentry.captureException(error);
        throw new Error('Failed to add crop');
    }

    revalidatePath('/settings');
    revalidatePath('/settings/lots');
}

