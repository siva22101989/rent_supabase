'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { getUserWarehouse } from './data';
import { WarehouseWithRole } from './definitions';
import { checkRateLimit } from '@/lib/rate-limit';
import * as Sentry from "@sentry/nextjs";
import { logError, logWarning } from './error-logger';

export type ActionState = {
  message: string;
  success: boolean;
  data?: any;
};

// --- Warehouse Management ---

export async function createWarehouse(name: string, location: string, capacity: number, email?: string, phone?: string, gstNumber?: string): Promise<ActionState> {
    return Sentry.startSpan(
        {
            op: "function",
            name: "createWarehouse",
        },
        async (span) => {
            const supabase = await createClient();
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                logWarning("Unauthorized warehouse creation attempt", { operation: 'createWarehouse' });
                return { message: 'Unauthorized', success: false };
            }
            
            try {
                await checkRateLimit(user.id, 'createWarehouse', { limit: 3, windowMs: 3600000 }); // 3 per hour
            } catch (e: any) {
                 return { message: e.message, success: false };
            }

            span.setAttribute("warehouseName", name);

            // 1. Plan Verification (Multi-Warehouse check)
            const { data: profile } = await supabase
                .from('profiles')
                .select('warehouse_id')
                .eq('id', user.id)
                .single();

            if (profile?.warehouse_id) {
                const { data: sub } = await supabase
                    .from('subscriptions')
                    .select('*, plans(*)')
                    .eq('warehouse_id', profile.warehouse_id)
                    .single();
                
                const tier = sub?.plans?.tier || 'free';
                if (tier === 'free' || tier === 'starter') {
                    return { 
                        message: 'Upgrade Required: Multi-warehouse support is available on the Professional plan and above.', 
                        success: false 
                    };
                }
            }

            // 2. Create Warehouse via Secure RPC (updated for GST)
            const { data: warehouseId, error } = await supabase.rpc('create_new_warehouse', {
                p_name: name,
                p_location: location,
                p_capacity: capacity,
                p_email: email,
                p_phone: phone
            });

            if (error) {
                logError(error, { operation: 'createWarehouse', metadata: { warehouseName: name } });
                return { 
                    message: 'Failed to create warehouse: ' + error.message, 
                    success: false,
                    data: { name, location, capacity, email, phone, gstNumber }
                };
            }
            
            // Update GST Number immediately if provided
            if (gstNumber) {
                 await supabase.from('warehouses').update({ gst_number: gstNumber }).eq('id', warehouseId);
            }

            // 2. Switch Context
            await switchWarehouse(warehouseId);

            // 3. Activate Trial (if new user)
            const selectedPlan = user.user_metadata?.selected_plan;
            if (selectedPlan) {
                 try {
                     const { createTrialSubscription } = await import('@/lib/auth-actions');
                     await createTrialSubscription(user.id, selectedPlan, warehouseId);
                     Sentry.addBreadcrumb({
                         category: 'subscription',
                         message: 'Trial activated for new warehouse',
                         data: { warehouseId, plan: selectedPlan },
                         level: 'info'
                     });
                 } catch (e) {
                     logError(e, { operation: 'createWarehouse_trialActivation', metadata: { warehouseId, plan: selectedPlan } });
                 }
            }

            Sentry.addBreadcrumb({
                category: 'warehouse',
                message: 'Warehouse created successfully',
                data: { warehouseId, warehouseName: name },
                level: 'info'
            });
            revalidatePath('/', 'layout');
            return { message: 'Warehouse created!', success: true, data: { id: warehouseId } };
        }
    );
}



export async function switchWarehouse(warehouseId: string): Promise<ActionState> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { message: 'Unauthorized', success: false };

    // Check user profile for super_admin
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    const isSuperAdmin = profile?.role === 'super_admin';

    let role = 'staff'; // Default fallback

    if (isSuperAdmin) {
        // Super Admin bypasses assignment check
        role = 'super_admin';
    } else {
        // Verify Access for normal users
        const { data: access } = await supabase
            .from('warehouse_assignments')
            .select('role')
            .eq('user_id', user.id)
            .eq('warehouse_id', warehouseId)
            .single();

        if (!access) return { message: 'Access Denied', success: false };
        role = access.role;
    }

    // Update Profile
    const { error } = await supabase
        .from('profiles')
        .update({ 
            warehouse_id: warehouseId,
            role: role // Sync role (Super Admin stays Super Admin)
        })
        .eq('id', user.id);

    if (error) return { message: 'Failed to switch: ' + error.message, success: false };

    revalidatePath('/', 'layout');
    return { message: 'Switched successfully', success: true };
}

export async function getUserWarehouses(): Promise<WarehouseWithRole[]> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    // Check if Super Admin
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    
    if (profile?.role === 'super_admin') {
        // Fetch ALL warehouses via Secure RPC to bypass RLS recursion
        const { data, error } = await supabase.rpc('get_admin_warehouses');
        
        if (error) {
            logError(error, { operation: 'getUserWarehouses_superAdmin' });
            return [];
        }

        return data.map((w: any) => ({
            id: w.id,
            role: 'super_admin',
            name: w.name,
            location: w.location || '',
            gst_number: w.gst_number || ''
        }));
    }

    // Normal User: Join assignments with warehouses
    const { data, error } = await supabase
        .from('warehouse_assignments')
        .select(`
            role,
            warehouse_id,
            warehouses (
                id,
                id,
                name,
                location,
                gst_number
            )
        `)
        .eq('user_id', user.id)
        .is('deleted_at', null);
    
    if (error) {
        logError(error, { operation: 'getUserWarehouses', metadata: { userId: user.id } });
        return [];
    }

    return data.map((d: any) => ({
        id: d.warehouse_id,
        role: d.role,
        name: d.warehouses?.name || 'Unknown',
        location: d.warehouses?.location || '',
        gst_number: d.warehouses?.gst_number || ''
    }));
}

export async function getActiveWarehouseId() {
   return getUserWarehouse();
}


// --- Invitations (Magic Links) ---

export async function generateInviteLink(role: 'owner' | 'admin' | 'manager' | 'staff' = 'staff'): Promise<ActionState> {
    const supabase = await createClient();
    const warehouseId = await getUserWarehouse();
    if (!warehouseId) return { message: 'No active warehouse', success: false };

    // Check Permissions (Owner/Admin only) - Enforced by RLS, but safe check here
    // ...

    const { data, error } = await supabase
        .from('warehouse_invitations')
        .insert({
            warehouse_id: warehouseId,
            role,
            // token generated by default
        })
        .select('token')
        .single();

    if (error) return { message: 'Failed to generate link', success: false };

    // Return the full URL (assuming current host is origin)
    // We can just return the token and let UI build the link to avoid host issues in server actions
    return { message: 'Link generated', success: true, data: { token: data.token } };
}

export async function joinWarehouse(token: string): Promise<ActionState> {
    return Sentry.startSpan(
        {
            op: "function",
            name: "joinWarehouse",
        },
        async (span) => {
            const supabase = await createClient();
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                logWarning("Unauthorized join warehouse attempt", { operation: 'joinWarehouse' });
                return { message: 'Please login to join', success: false };
            }

            span.setAttribute("token", token);

            // 1. Verify Token & Get Details
            // RPC 'claim_invite'
            const { data, error } = await supabase.rpc('claim_warehouse_invite', {
                p_token: token,
                p_user_id: user.id
            });

            if (error) {
                logError(error, { operation: 'joinWarehouse', metadata: { token } });
                return { message: error.message, success: false };
            }

            // Switch to new warehouse immediately
            // The RPC returns warehouse_id
            await switchWarehouse(data); 

            Sentry.addBreadcrumb({
                category: 'warehouse',
                message: 'Joined warehouse successfully',
                data: { warehouseId: data },
                level: 'info'
            });
            revalidatePath('/', 'layout');
            return { message: 'Joined successfully!', success: true };
        }
    );
}

export async function leaveWarehouse(warehouseId: string): Promise<ActionState> {
     const supabase = await createClient();
     const { data: { user } } = await supabase.auth.getUser();
     if (!user) return { message: 'Unauthorized', success: false };

     const { error } = await supabase
        .from('warehouse_assignments')
        .update({ deleted_at: new Date().toISOString() })
        .eq('user_id', user.id)
        .eq('warehouse_id', warehouseId);

    if (error) return { message: 'Failed to leave', success: false };
    
    // Select another warehouse or set null?
    await supabase.from('profiles').update({ warehouse_id: null }).eq('id', user.id);

    revalidatePath('/', 'layout');
    return { message: 'Left warehouse', success: true };
}

// Request Access Flow
export async function requestJoinWarehouse(adminEmail: string): Promise<ActionState> {
    return Sentry.startSpan(
        {
            op: "function",
            name: "requestJoinWarehouse",
        },
        async (span) => {
            const supabase = await createClient();
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                logWarning("Unauthorized join warehouse request", { operation: 'requestJoinWarehouse' });
                return { message: 'Unauthorized', success: false };
            }

            span.setAttribute("adminEmail", adminEmail);

            // 1. Find Admin/Owner User
            const { data: adminProfile } = await supabase
                .from('profiles')
                .select('id, warehouse_id')
                .eq('email', adminEmail)
                .in('role', ['admin', 'owner', 'super_admin']) // Allow owners and super admins too
                .single();
            
            if (!adminProfile || !adminProfile.warehouse_id) {
                logWarning("Admin not found for join request", { operation: 'requestJoinWarehouse', metadata: { adminEmail } });
                return { message: 'Admin not found or has no warehouse.', success: false };
            }

            // 3. Create Notification
            const { error } = await supabase
                .from('notifications')
                .insert({
                    user_id: adminProfile.id, // Target the Admin
                    warehouse_id: adminProfile.warehouse_id,
                    type: 'join_request',
                    title: 'Staff Join Request',
                    message: `User ${user.user_metadata?.full_name || 'Staff'} (${user.email}) requested to join.`,
                    link: `/settings/team?approve_user=${user.id}&name=${encodeURIComponent(user.user_metadata?.full_name || '')}`,
                    is_read: false
                });

            if (error) {
                logError(error, { operation: 'requestJoinWarehouse_sendNotif', metadata: { adminEmail } });
                return { message: 'Failed to send request: ' + error.message, success: false };
            }

            Sentry.addBreadcrumb({
                category: 'notification',
                message: 'Join request sent successfully',
                data: { adminEmail, requesterId: user.id },
                level: 'info'
            });
            return { message: 'Request sent successfully', success: true };
        }
    );
}

export async function approveJoinRequest(notificationId: string, requesterId: string): Promise<ActionState> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { message: 'Unauthorized', success: false };

    // 1. Verify Admin Access (ensure the notification belongs to this admin)
    const { data: notification } = await supabase
        .from('notifications')
        .select('*')
        .eq('id', notificationId)
        .eq('user_id', user.id)
        .single();
    
    if (!notification) return { message: 'Request not found or unauthorized', success: false };

    // 2. Assign User to Warehouse
    const warehouseId = notification.warehouse_id;
    
    const { error: assignError } = await supabase
        .from('warehouse_assignments')
        .insert({
            user_id: requesterId,
            warehouse_id: warehouseId,
            role: 'staff' // Default role for joiners
        });

    if (assignError) return { message: 'Failed to assign user: ' + assignError.message, success: false };

    // 3. Update User Profile (Set Active Warehouse & Role)
    await supabase.from('profiles').update({ 
        warehouse_id: warehouseId,
        role: 'staff' // Set role to staff as they are joining
    }).eq('id', requesterId);

    // 4. Delete Notification
    await supabase.from('notifications').delete().eq('id', notificationId);

    revalidatePath('/', 'layout');
    return { message: 'User approved successfully', success: true };
}

export async function rejectJoinRequest(notificationId: string): Promise<ActionState> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { message: 'Unauthorized', success: false };

    const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId)
        .eq('user_id', user.id);

    if (error) return { message: 'Failed to delete request', success: false };

    revalidatePath('/settings/team');
    return { message: 'Request rejected', success: true };
}
