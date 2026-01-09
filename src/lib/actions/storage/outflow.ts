'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import * as Sentry from "@sentry/nextjs";

import { createClient } from '@/utils/supabase/server';
import { getAuthUser } from '@/lib/queries/auth'; // Import for rate limiting
import { getStorageRecord, getCustomer } from '@/lib/queries';
import { updateStorageRecord, addPaymentToRecord, saveWithdrawalTransaction } from '@/lib/data';
import { checkRateLimit } from '@/lib/rate-limit';
import { getNextInvoiceNumber } from '@/lib/sequence-utils';
import { logError } from '@/lib/error-logger';
import { BillingService } from '@/lib/billing';
import { FormState } from '../common';
import type { StorageRecord } from '@/lib/definitions';

const { logger } = Sentry;

const OutflowSchema = z.object({
    recordId: z.string().min(1, 'A storage record must be selected.'),
    bagsToWithdraw: z.coerce.number().int().positive('Bags to withdraw must be a positive number.'),
    withdrawalDate: z.string().refine(val => {
        const date = new Date(val);
        return !isNaN(date.getTime()) && date <= new Date();
    }, { message: "Date cannot be in the future" }),
    finalRent: z.coerce.number().nonnegative('Final rent cannot be negative.'),
    amountPaidNow: z.coerce.number().nonnegative('Amount paid must be non-negative.').optional(),
});

export type OutflowFormState = {
    message: string;
    success: boolean;
    data?: Record<string, any>;
};

export async function addOutflow(prevState: OutflowFormState, formData: FormData): Promise<OutflowFormState> {
    return Sentry.startSpan(
        {
            op: "function",
            name: "addOutflow",
        },
        async (span) => {
            const rawData = {
                recordId: formData.get('recordId'),
                bagsToWithdraw: formData.get('bagsToWithdraw'),
                withdrawalDate: formData.get('withdrawalDate'),
                finalRent: formData.get('finalRent'),
                amountPaidNow: formData.get('amountPaidNow'),
            };
            const recordIdForLimit = rawData.recordId as string;
            await checkRateLimit(recordIdForLimit || 'anon', 'addOutflow', { limit: 10 });
            span.setAttribute("recordId", recordIdForLimit);

            const validatedFields = OutflowSchema.safeParse(rawData);

            if (!validatedFields.success) {
                const error = validatedFields.error.flatten().fieldErrors;
                const message = Object.values(error).flat().join(', ');
                logger.warn("Outflow validation failed", { errors: error });
                return { message: `Invalid data: ${message}`, success: false, data: rawData };
            }
            
            const { recordId, bagsToWithdraw, withdrawalDate, finalRent, amountPaidNow } = validatedFields.data;
            span.setAttribute("bagsToWithdraw", bagsToWithdraw);
            
            const originalRecord = await getStorageRecord(recordId);

            if (!originalRecord) {
                logger.error("Storage record not found for outflow", { recordId });
                return { message: 'Record not found.', success: false, data: rawData };
            }

            if (bagsToWithdraw > originalRecord.bagsStored) {
                logger.warn("Attempted to withdraw more bags than available", { recordId, available: originalRecord.bagsStored, requested: bagsToWithdraw });
                return { message: 'Cannot withdraw more bags than are in storage.', success: false, data: rawData };
            }

            if (new Date(withdrawalDate) < originalRecord.storageStartDate) {
                return { message: 'Withdrawal date cannot be before storage start date.', success: false, data: rawData };
            }

            const paymentMade = amountPaidNow || 0;
            
            const { updates: recordUpdate } = BillingService.calculateOutflowImpact(
                originalRecord, 
                bagsToWithdraw, 
                finalRent, 
                new Date(withdrawalDate)
            );

            try {
                if (paymentMade > 0) {
                    await addPaymentToRecord(recordId, { 
                        amount: paymentMade, 
                        date: new Date(withdrawalDate), 
                        type: 'rent',
                        notes: 'Rent paid during outflow' 
                    });
                    logger.info("Payment added during outflow", { recordId, amount: paymentMade });
                }

                // Generate Outflow Invoice Number if not present (First Outflow)
                if (!originalRecord.outflowInvoiceNo) {
                    // @ts-ignore - Field exists in DB
                    recordUpdate.outflow_invoice_no = await getNextInvoiceNumber('outflow'); 
                }
                
                await updateStorageRecord(recordId, recordUpdate);

                // Update Lot Capacity Manually (Reliability Fix) - REMOVED
                // Manual update is redundant because 'updateStorageRecord' above
                // triggers 'sync_lot_stock' in the database, which recalculates stock.
                // Keeping two sources of truth causes sync issues.

                // Save Withdrawal Transaction Audit
                const transactionId = await saveWithdrawalTransaction(recordId, bagsToWithdraw, new Date(withdrawalDate), finalRent);

                // Send SMS Notification
                const sendSms = formData.get('sendSms') === 'true';
                if (transactionId && sendSms) {
                    const { sendOutflowConfirmationSMS } = await import('@/lib/sms-event-actions');
                    await sendOutflowConfirmationSMS(transactionId, true);
                }

                const { createNotification } = await import('@/lib/logger');
                
                // Fetch customer for notification readability
                const customer = await getCustomer(originalRecord.customerId);
                const customerName = customer?.name || 'Unknown';

                await createNotification(
                    'Outflow Recorded', 
                    `Withdrawn ${bagsToWithdraw} bags (${originalRecord.commodityDescription}) for ${customerName}`, 
                    'info',
                    undefined, 
                    `/outflow/receipt/${recordId}`
                );

                logger.info("Outflow recorded successfully", { recordId, bagsOut: bagsToWithdraw });
                revalidatePath('/storage');
                revalidatePath('/reports');
                redirect(`/outflow/receipt/${recordId}?withdrawn=${bagsToWithdraw}&rent=${finalRent}&paidNow=${paymentMade}`);
            } catch (error: any) {
                if (error.message === 'NEXT_REDIRECT') throw error;
                Sentry.captureException(error);
                logger.error("Failed to record outflow", { error: error.message, recordId });
                throw error; // Or return error state
            }
        }
    );
}

export async function deleteOutflow(transactionId: string) {
    const user = await getAuthUser();
    await checkRateLimit(user?.id || 'anon', 'deleteOutflow', { limit: 10 });
    
    const supabase = await createClient();
    
    // 1. Get Transaction
    const { data: transaction, error: txError } = await supabase
        .from('withdrawal_transactions')
        .select('*')
        .eq('id', transactionId)
        .single();
    
    if (txError || !transaction) {
        return { success: false, message: 'Transaction not found' };
    }

    const recordId = transaction.record_id; // assuming column is record_id
    // If not, use storage_record if joined. But we want fresh CamelCase.
    // Let's assume record_id is on transaction table. (Check step 2374: select * includes record_id?)
    // data.ts: saveWithdrawalTransaction uses .insert({ storage_record_id: recordId ... })
    // So column is likely `storage_record_id`.
    
    const storageRecordId = transaction.storage_record_id;

    if (!storageRecordId) {
        return { success: false, message: 'Transaction has no record ID' };
    }

    const record = await getStorageRecord(storageRecordId);
    if (!record) {
         return { success: false, message: 'Associated storage record not found' };
    }

    // 2. Prepare Updates via Service
    const bagsRestored = transaction.bags_withdrawn;
    const rentReversed = transaction.rent_collected || 0;

    const { updates } = BillingService.calculateReversalImpact(record, bagsRestored, rentReversed);

    try {
        await updateStorageRecord(record.id, updates);
    } catch (updateError: any) {
        logError(updateError, { operation: 'deleteOutflow_revert', metadata: { recordId: record.id } });
        return { success: false, message: 'Failed to update storage record' };
    }

    // 4. Delete Transaction
    // 4. Soft Delete Transaction
    const { error: delError } = await supabase
        .from('withdrawal_transactions')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', transactionId);

    if (delError) {
         return { success: false, message: 'Failed to delete transaction log' };
    }

    revalidatePath('/outflow');
    revalidatePath('/storage');

    if (record.customerId) {
        revalidatePath(`/customers/${record.customerId}`);
    }
    
    return { success: true, message: 'Outflow reverted successfully.' };
}

export async function updateOutflow(transactionId: string, formData: FormData) {
    const user = await getAuthUser();
    await checkRateLimit(user?.id || 'anon', 'updateOutflow', { limit: 10 });

    const supabase = await createClient();
    
    const bags = parseInt(formData.get('bags') as string);
    const date = formData.get('date') as string;
    const rent = parseFloat(formData.get('rent') as string);

    if (isNaN(bags) || bags <= 0) return { success: false, message: 'Invalid bags quantity' };
    if (isNaN(rent) || rent < 0) return { success: false, message: 'Invalid rent amount' };
    
    // 1. Get Transaction
    const { data: transaction, error: txError } = await supabase
        .from('withdrawal_transactions')
        .select('*')
        .eq('id', transactionId)
        .single();
    
    if (txError || !transaction) return { success: false, message: 'Transaction not found' };
    
    const storageRecordId = transaction.storage_record_id;
    if (!storageRecordId) return { success: false, message: 'Transaction has no record ID' };

    const record = await getStorageRecord(storageRecordId);
    if (!record) return { success: false, message: 'Storage record not found' };

    // 2. Calculate Updates via Service
    try {
        const { updates } = BillingService.calculateUpdateImpact(
            record,
            { bags: transaction.bags_withdrawn, rent: transaction.rent_collected || 0 },
            { bags: bags, rent: rent, date: new Date(date) }
        );

        // 4. Apply Updates
        await updateStorageRecord(record.id, updates);

        // C. Update Transaction Log
        const { error: txUpdateError } = await supabase.from('withdrawal_transactions').update({
            bags_withdrawn: bags,
            rent_collected: rent,
            withdrawal_date: new Date(date)
        }).eq('id', transactionId);

        if (txUpdateError) return { success: false, message: 'Failed to update transaction' };

        revalidatePath('/outflow');
        revalidatePath('/storage');

        return { success: true, message: 'Outflow updated successfully' };

    } catch (e: any) {
         return { success: false, message: e.message };
    }
}
