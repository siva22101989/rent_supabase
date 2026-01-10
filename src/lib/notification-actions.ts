'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';
import { logError } from '@/lib/error-logger';

export interface NotificationPreferences {
    id: string;
    user_id: string;
    warehouse_id: string;
    payment_received: boolean;
    low_stock_alert: boolean;
    pending_dues: boolean;
    new_inflow: boolean;
    new_outflow: boolean;
    in_app: boolean;
    email: boolean;
    sms: boolean;
    created_at: string;
    updated_at: string;
}

export async function getNotificationPreferences(warehouseId: string): Promise<NotificationPreferences | null> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) return null;

    // Get or create preferences
    const { data, error } = await supabase
        .rpc('get_or_create_preferences', {
            p_user_id: user.id,
            p_warehouse_id: warehouseId
        })
        .single();

    if (error) {
        logError(error, { operation: 'getNotificationPreferences', metadata: { warehouseId } });
        return null;
    }

    return data as NotificationPreferences | null;
}

export async function updateNotificationPreferences(
    warehouseId: string,
    preferences: Partial<Omit<NotificationPreferences, 'id' | 'user_id' | 'warehouse_id' | 'created_at' | 'updated_at'>>
) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
        return { error: 'Unauthorized' };
    }

    const { error } = await supabase
        .from('notification_preferences')
        .upsert({
            user_id: user.id,
            warehouse_id: warehouseId,
            ...preferences
        }, {
            onConflict: 'user_id,warehouse_id'
        });

    if (error) {
        logError(error, { operation: 'updateNotificationPreferences', metadata: { warehouseId } });
        return { error: 'Failed to update preferences' };
    }

    revalidatePath('/settings');
    return { success: true };
}

export async function markNotificationsAsRead(notificationIds: string[]) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) return { error: 'Unauthorized' };

    const { error } = await supabase
        .from('notification_reads')
        .upsert(
            notificationIds.map(id => ({ notification_id: id, user_id: user.id })),
            { onConflict: 'notification_id,user_id' }
        );

    if (error) {
        logError(error, { operation: 'markNotificationsAsRead', metadata: { count: notificationIds.length } });
        return { error: 'Failed to update status' };
    }
    
    return { success: true };
}

export async function markAllNotificationsAsRead() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Unauthorized' };

    // 1. Get all relevant notification IDs
    const { data: allNotes, error: fetchError } = await supabase
        .from('notifications')
        .select('id')
        .or(`user_id.is.null,user_id.eq.${user.id}`);

    if (fetchError) return { error: fetchError.message };

    if (!allNotes || allNotes.length === 0) return { success: true };

    // 2. Get already read IDs
    const { data: readNotes, error: readError } = await supabase
        .from('notification_reads')
        .select('notification_id')
        .eq('user_id', user.id);

    if (readError) return { error: readError.message };

    const readSet = new Set(readNotes?.map(r => r.notification_id) || []);
    const unreadIds = allNotes.filter(n => !readSet.has(n.id)).map(n => n.id);

    if (unreadIds.length === 0) return { success: true };

    // 3. Bulk insert in chunks
    const chunkSize = 1000;
    for (let i = 0; i < unreadIds.length; i += chunkSize) {
        const chunk = unreadIds.slice(i, i + chunkSize);
        const { error: insertError } = await supabase
            .from('notification_reads')
            .upsert(
                chunk.map(id => ({ notification_id: id, user_id: user.id })),
                { onConflict: 'notification_id,user_id' }
            );
        
        if (insertError) logError(insertError, { operation: 'markAllNotificationsAsRead_batch', metadata: { chunkIndex: i } });
    }

    return { success: true };
}
