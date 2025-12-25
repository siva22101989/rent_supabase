'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';

/**
 * Get SMS settings for current warehouse
 */
export async function getSMSSettings() {
    const supabase = await createClient();
    
    const { data: warehouse } = await supabase
        .from('user_warehouses')
        .select('warehouse_id')
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
        .single();
    
    if (!warehouse) {
        return null;
    }
    
    const { data, error } = await supabase
        .from('sms_settings')
        .select('*')
        .eq('warehouse_id', warehouse.warehouse_id)
        .single();
    
    // Create default settings if none exist
    if (error || !data) {
        const { data: newSettings } = await supabase
            .from('sms_settings')
            .insert({
                warehouse_id: warehouse.warehouse_id,
                enable_payment_reminders: true,
                enable_inflow_welcome: false,
                enable_outflow_confirmation: false,
                enable_payment_confirmation: false,
            })
            .select()
            .single();
        
        return newSettings;
    }
    
    return data;
}

/**
 * Update SMS settings
 */
export async function updateSMSSettings(settings: {
    enable_payment_reminders?: boolean;
    enable_inflow_welcome?: boolean;
    enable_outflow_confirmation?: boolean;
    enable_payment_confirmation?: boolean;
}) {
    const supabase = await createClient();
    
    const { data: warehouse } = await supabase
        .from('user_warehouses')
        .select('warehouse_id')
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
        .single();
    
    if (!warehouse) {
        return { success: false, error: 'Warehouse not found' };
    }
    
    const { error } = await supabase
        .from('sms_settings')
        .update({
            ...settings,
            updated_at: new Date().toISOString(),
        })
        .eq('warehouse_id', warehouse.warehouse_id);
    
    if (error) {
        return { success: false, error: error.message };
    }
    
    revalidatePath('/settings');
    return { success: true };
}

/**
 * Check if a specific SMS type is enabled
 */
export async function isSMSEnabled(type: 'payment_reminders' | 'inflow_welcome' | 'outflow_confirmation' | 'payment_confirmation'): Promise<boolean> {
    const settings = await getSMSSettings();
    
    if (!settings) return false;
    
    switch (type) {
        case 'payment_reminders':
            return settings.enable_payment_reminders ?? true;
        case 'inflow_welcome':
            return settings.enable_inflow_welcome ?? false;
        case 'outflow_confirmation':
            return settings.enable_outflow_confirmation ?? false;
        case 'payment_confirmation':
            return settings.enable_payment_confirmation ?? false;
        default:
            return false;
    }
}
