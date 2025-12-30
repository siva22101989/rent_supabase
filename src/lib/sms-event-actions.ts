/**
 * SMS Actions for Inflow and Outflow
 */
'use server';

import { textBeeService } from '@/lib/textbee';
import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';
import { isSMSEnabled } from '@/lib/sms-settings-actions';

/**
 * Send welcome SMS when inflow is created
 */
export async function sendInflowWelcomeSMS(storageRecordId: string, bypassSettings: boolean = false) {
    // Check settings
    const enabled = await isSMSEnabled('inflow_welcome');
    
    if (!enabled && !bypassSettings) {
        return { success: false, error: 'SMS disabled in settings' };
    }

    try {
        const supabase = await createClient();
        
        // Get storage record with customer and warehouse details
        const { data: record, error } = await supabase
            .from('storage_records')
            .select(`
                *,
                customers (
                    name,
                    phone
                ),
                warehouse_lots (
                    name
                ),
                warehouses (
                    name
                )
            `)
            .eq('id', storageRecordId)
            .single();
        
        if (error || !record || !record.customers) {
            console.error('Failed to fetch record for SMS:', error);
            return { success: false, error: 'Record not found' };
        }
        
        const customer = Array.isArray(record.customers) ? record.customers[0] : record.customers;
        const warehouse = Array.isArray(record.warehouses) ? record.warehouses[0] : record.warehouses;
        const lot = Array.isArray(record.warehouse_lots) ? record.warehouse_lots[0] : record.warehouse_lots;
        
        // Format storage date
        const storageDate = record.storage_start_date 
            ? new Date(record.storage_start_date).toLocaleDateString('en-IN', { 
                day: '2-digit', 
                month: 'short', 
                year: 'numeric' 
              })
            : undefined;
        
        // Send SMS with detailed information
        const result = await textBeeService.sendInflowWelcome({
            warehouseName: warehouse?.name || 'Warehouse',
            customerName: customer.name,
            phone: customer.phone,
            commodity: record.commodity_description || 'Storage',
            bags: record.bags_stored || 0,
            recordNumber: record.record_number || record.id.substring(0, 8),
            storageDate,
            location: lot?.name,
        });
        
        // Log SMS
        if (result.success) {
            await supabase.from('sms_logs').insert({
                customer_id: record.customer_id,
                phone: customer.phone,
                message_type: 'inflow_welcome',
                message_id: result.messageId,
                status: 'sent',
                record_id: storageRecordId,
            });
        }
        
        return result;
    } catch (error) {
        console.error('Error sending inflow SMS:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to send SMS',
        };
    }
}

/**
 * Send confirmation SMS when outflow is processed
 */
export async function sendOutflowConfirmationSMS(transactionId: string, bypassSettings: boolean = false) {
    // Check settings
    const enabled = await isSMSEnabled('outflow_confirmation');
    
    if (!enabled && !bypassSettings) {
        return { success: false, error: 'SMS disabled in settings' };
    }

    try {
        const supabase = await createClient();
        
        // Get transaction with record, customer, and warehouse details
        const { data: transaction, error } = await supabase
            .from('withdrawal_transactions')
            .select(`
                *,
                storage_records (
                    record_number,
                    commodity_description,
                    warehouse_id,
                    customers (
                        name,
                        phone
                    ),
                    warehouses (
                        name
                    )
                )
            `)
            .eq('id', transactionId)
            .single();
        
        if (error || !transaction || !transaction.storage_records) {
            console.error('Failed to fetch transaction for SMS:', error);
            return { success: false, error: 'Transaction not found' };
        }
        
        const record = transaction.storage_records;
        const customer = Array.isArray(record.customers) ? record.customers[0] : record.customers;
        const warehouse = Array.isArray(record.warehouses) ? record.warehouses[0] : record.warehouses;
        
        // Send SMS with detailed financial information
        const result = await textBeeService.sendOutflowConfirmation({
            warehouseName: warehouse?.name || 'Warehouse',
            customerName: customer.name,
            phone: customer.phone,
            commodity: record.commodity_description || 'Storage',
            bags: transaction.bags_withdrawn || 0,
            recordNumber: record.record_number || transaction.record_id.substring(0, 8),
            invoiceNumber: transaction.invoice_number || transaction.id.substring(0, 8),
            rentAmount: transaction.rent_collected,
            hamaliAmount: transaction.hamali_charged,
            totalAmount: (transaction.rent_collected || 0) + (transaction.hamali_charged || 0),
        });
        
        // Log SMS
        if (result.success) {
            await supabase.from('sms_logs').insert({
                customer_id: transaction.storage_records.customers.id,
                phone: customer.phone,
                message_type: 'outflow_confirmation',
                message_id: result.messageId,
                status: 'sent',
                record_id: transaction.record_id,
            });
        }
        
        return result;
    } catch (error) {
        console.error('Error sending outflow SMS:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to send SMS',
        };
    }
}

/**
 * Send payment confirmation SMS
 */
export async function sendPaymentConfirmationSMS(paymentId: string) {
    // Check settings
    if (!(await isSMSEnabled('payment_confirmation'))) {
        return { success: false, error: 'SMS disabled in settings' };
    }

    try {
        const supabase = await createClient();
        
        // Get payment with record, customer, and warehouse details
        const { data: payment, error } = await supabase
            .from('payments')
            .select(`
                *,
                storage_records (
                    record_number,
                    customers (
                        name,
                        phone
                    ),
                    warehouses (
                        name
                    )
                )
            `)
            .eq('id', paymentId)
            .single();
        
        if (error || !payment || !payment.storage_records) {
            console.error('Failed to fetch payment for SMS:', error);
            return { success: false, error: 'Payment not found' };
        }
        
        const record = payment.storage_records;
        const customer = Array.isArray(record.customers) ? record.customers[0] : record.customers;
        const warehouse = Array.isArray(record.warehouses) ? record.warehouses[0] : record.warehouses;
        
        // Send SMS
        const result = await textBeeService.sendPaymentConfirmation({
            warehouseName: warehouse?.name || 'Warehouse',
            customerName: customer.name,
            phone: customer.phone,
            amount: payment.amount,
            recordNumber: record.record_number || payment.record_id.substring(0, 8),
        });
        
        // Log SMS
        if (result.success) {
            await supabase.from('sms_logs').insert({
                customer_id: payment.storage_records.customers.id,
                phone: customer.phone,
                message_type: 'payment_confirmation',
                message_id: result.messageId,
                status: 'sent',
                record_id: payment.record_id,
            });
        }
        
        return result;
    } catch (error) {
        console.error('Error sending payment confirmation SMS:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to send SMS',
        };
    }
}
