
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

/**
 * Send payment reminder SMS via TextBee
 */
export async function sendPaymentReminderSMS(customerId: string, recordId?: string) {
    // Check if payment reminders enabled
    if (!(await isSMSEnabled('payment_reminders'))) {
        return { success: false, error: 'SMS disabled in settings' };
    }

    try {
        const supabase = await createClient();
        
        // Get customer details
        const { data: customer, error: customerError } = await supabase
            .from('customers')
            .select('*')
            .eq('id', customerId)
            .single();
        
        if (customerError || !customer) {
            return { success: false, error: 'Customer not found' };
        }
        
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
                console.log('SMS sent but not logged (sms_logs table not found):', logError.message);
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
