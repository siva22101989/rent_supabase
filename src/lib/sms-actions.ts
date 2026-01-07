
'use server';

import { z } from 'zod';
import { createClient } from '@/utils/supabase/server';
import { getStorageRecords, getCustomers, getStorageRecord, getCustomer, getUserWarehouse, getAvailableCrops, getAvailableLots, getTeamMembers, getDashboardMetrics, searchActiveStorageRecords } from '@/lib/queries';
import { saveCustomer, saveStorageRecord, updateStorageRecord, addPaymentToRecord, deleteStorageRecord, saveExpense, updateExpense, deleteExpense } from '@/lib/data';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { detectStorageAnomalies as detectStorageAnomaliesFlow } from '@/ai/flows/anomaly-detection';
import type { StorageRecord, Payment } from './definitions';
import { expenseCategories } from './definitions';
import { getNextInvoiceNumber } from '@/lib/sequence-utils';
import * as Sentry from "@sentry/nextjs";
import { logError } from '@/lib/error-logger';
import { isSMSEnabled } from '@/lib/sms-settings-actions';
import { textBeeService } from '@/lib/textbee';

/**
 * Check if current user/warehouse has SMS permission
 */
export async function hasSMSPermission(): Promise<boolean> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) return false;
    
    // Get whitelist from environment variable (comma-separated user IDs or warehouse IDs)
    const allowedUsers = process.env.SMS_ALLOWED_USERS?.split(',').map(id => id.trim()) || [];
    const allowedWarehouses = process.env.SMS_ALLOWED_WAREHOUSES?.split(',').map(id => id.trim()) || [];
    
    // Check if user is in whitelist
    if (allowedUsers.includes(user.id)) return true;
    
    // Check if user's warehouse is in whitelist
    const { data: profile } = await supabase
        .from('profiles')
        .select('warehouse_id')
        .eq('id', user.id)
        .single();
    
    if (profile?.warehouse_id && allowedWarehouses.includes(profile.warehouse_id)) {
        return true;
    }
    
    return false;
}

/**
 * Send payment reminder SMS via TextBee
 */
export async function sendPaymentReminderSMS(customerId: string, recordId?: string) {
    // Check SMS permission first
    const hasPermission = await hasSMSPermission();
    if (!hasPermission) {
        return { 
            success: false, 
            error: 'SMS service is disabled for trial users. Please upgrade your plan to enable SMS notifications.' 
        };
    }
    
    // Check if payment reminders enabled
    if (!(await isSMSEnabled('payment_reminders'))) {
        return { success: false, error: 'SMS disabled in settings' };
    }

    try {
        const supabase = await createClient();
        
        // Get customer details along with warehouse name
        const { data: customer, error: customerError } = await supabase
            .from('customers')
            .select('*, warehouses(name)')
            .eq('id', customerId)
            .single();
        
        if (customerError || !customer) {
            return { success: false, error: 'Customer not found' };
        }
        
        const warehouse = Array.isArray(customer.warehouses) ? customer.warehouses[0] : customer.warehouses;
        
        // Get customer's balance from view
        const { data: balanceData } = await supabase
            .from('customer_balances')
            .select('*')
            .eq('customer_id', customerId)
            .single();
        
        if (!balanceData || balanceData.balance <= 0) {
            return { success: false, error: 'No pending balance' };
        }
        
        // Get record number if specific record provided
        let recordNumber = 'Multiple Records';
        if (recordId) {
            const { data: record } = await supabase
                .from('storage_records')
                .select('record_number')
                .eq('id', recordId)
                .single();
            
            if (record) {
                recordNumber = record.record_number || recordId.substring(0, 8);
            }
        }
        
        // Send SMS via TextBee
        const result = await textBeeService.sendPaymentReminder({
            warehouseName: warehouse?.name || 'Warehouse',
            customerName: customer.name,
            phone: customer.phone,
            amount: balanceData.balance,
            recordNumber,
        });
        
        // Log SMS in database (optional - create sms_logs table if needed)
        if (result.success) {
            const { error: logError } = await supabase.from('sms_logs').insert({
                customer_id: customerId,
                phone: customer.phone,
                message_type: 'payment_reminder',
                message_id: result.messageId,
                status: 'sent',
            });
            
            // Ignore if table doesn't exist
            if (logError) {
                // SMS sent but not logged (sms_logs table may not exist)
            }
        }
        
        revalidatePath('/payments/pending');
        return result;
    } catch (error) {
        console.error('Error sending SMS:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to send SMS',
        };
    }
}
