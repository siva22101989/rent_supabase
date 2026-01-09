'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';

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
        console.error('Failed to fetch notification preferences:', error);
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
        console.error('Failed to update preferences:', error);
        return { error: 'Failed to update preferences' };
    }

    revalidatePath('/settings');
    return { success: true };
}
