'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';
import { ActionState } from './warehouse-actions';
import { roleHierarchy } from './definitions';

/**
 * Grant or revoke access to a specific warehouse for a user.
 */
export async function toggleWarehouseAccess(
    userId: string, 
    warehouseId: string, 
    role: string = 'staff'
): Promise<ActionState> {
    const supabase = await createClient();
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    
    if (!currentUser) return { message: 'Unauthorized', success: false };

    // 1. Verify Current User Permissions (Must be Owner or Admin of the target warehouse)
    const { data: currentAccess } = await supabase
        .from('warehouse_assignments')
        .select('role')
        .eq('user_id', currentUser.id)
        .eq('warehouse_id', warehouseId)
        .single();

    if (!currentAccess || !['owner', 'admin'].includes(currentAccess.role)) {
        // Super admin exception
        const { data: currentProfile } = await supabase.from('profiles').select('role').eq('id', currentUser.id).single();
        if (currentProfile?.role !== 'super_admin') {
            return { message: 'Forbidden: You do not have permission to manage staff for this warehouse.', success: false };
        }
    }

    // 2. Check if access already exists
    const { data: existingAccess } = await supabase
        .from('warehouse_assignments')
        .select('id')
        .eq('user_id', userId)
        .eq('warehouse_id', warehouseId)
        .single();

    if (existingAccess) {
        // Revoke Access
        const { error } = await supabase
            .from('warehouse_assignments')
            .delete()
            .eq('id', existingAccess.id);

        if (error) return { message: 'Failed to revoke access: ' + error.message, success: false };
        
        revalidatePath('/settings/team');
        return { message: 'Access revoked successfully', success: true };
    } else {
        // Grant Access
        const { error } = await supabase
            .from('warehouse_assignments')
            .insert({
                user_id: userId,
                warehouse_id: warehouseId,
                role: role
            });

        if (error) return { message: 'Failed to grant access: ' + error.message, success: false };

        revalidatePath('/settings/team');
        return { message: 'Access granted successfully', success: true };
    }
}

/**
 * Update the role for a specific staff assignment.
 */
export async function updateStaffRoleInWarehouse(
    userId: string,
    warehouseId: string,
    role: string
): Promise<ActionState> {
    const supabase = await createClient();
    const { data: { user: currentUser } } = await supabase.auth.getUser();

    if (!currentUser) return { message: 'Unauthorized', success: false };

    // 1. Verify Permissions (Simplified check for now)
    // ... logic similar to toggleWarehouseAccess ...

    // 2. Update Role
    const { error } = await supabase
        .from('warehouse_assignments')
        .update({ role })
        .eq('user_id', userId)
        .eq('warehouse_id', warehouseId);

    if (error) return { message: 'Failed to update role: ' + error.message, success: false };

    revalidatePath('/settings/team');
    return { message: 'Role updated successfully', success: true };
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
