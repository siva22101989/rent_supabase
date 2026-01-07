
'use server';

import { z } from 'zod';
import { createClient } from '@/utils/supabase/server';
import { getStorageRecords, getCustomers, getStorageRecord, getCustomer, getUserWarehouse, getAvailableCrops, getAvailableLots, getTeamMembers, getDashboardMetrics, searchActiveStorageRecords, getPaginatedStorageRecords } from '@/lib/queries';
import { saveCustomer, saveStorageRecord, updateStorageRecord, addPaymentToRecord, deleteStorageRecord, restoreStorageRecord, saveExpense, updateExpense, deleteExpense } from '@/lib/data';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { detectStorageAnomalies as detectStorageAnomaliesFlow } from '@/ai/flows/anomaly-detection';
import type { StorageRecord, Payment } from './definitions';
import { expenseCategories, roleHierarchy } from './definitions';
import { getNextInvoiceNumber } from '@/lib/sequence-utils';
import * as Sentry from "@sentry/nextjs";
import { logError } from '@/lib/error-logger';
import { checkRateLimit } from '@/lib/rate-limit';

const { logger } = Sentry;

// --- New Actions for Scalability ---
export async function signOutAction() {
  'use server';
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/login');
}

export async function findRecordsAction(query: string) {
    'use server';
    return await searchActiveStorageRecords(query);
}

export async function fetchStorageRecordsAction(
  page: number = 1, 
  limit: number = 20, 
  search?: string, 
  status: 'active' | 'all' | 'released' = 'active'
) {
    'use server';
    return await getPaginatedStorageRecords(page, limit, search, status);
}

export async function getStorageRecordAction(id: string) {
    'use server';
    return await getStorageRecord(id);
}

const NewCustomerSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters.'),
  phone: z.string().min(10, 'Phone number must be at least 10 digits.'),
  address: z.string().min(5, 'Address must be at least 5 characters.'),
  email: z.string().optional(),
  fatherName: z.string().optional(),
  village: z.string().optional(),
});

export type FormState = {
  message: string;
  success: boolean;
  data?: Record<string, any>;
};

export async function getAnomalyDetection() {
  return Sentry.startSpan(
    {
      op: "function",
      name: "getAnomalyDetection",
    },
    async () => {
      try {
        const records = await getStorageRecords();
        const result = await detectStorageAnomaliesFlow({ storageRecords: JSON.stringify(records) });
        logger.info("Anomaly detection completed", { count: result.anomalies.length });
        return { success: true, anomalies: result.anomalies };
      } catch (error: any) {
        Sentry.captureException(error);
        logger.error("Anomaly detection failed", { error: error.message });
        return { success: false, anomalies: 'An error occurred while analyzing records.' };
      }
    }
  );
}

export async function addCustomer(prevState: FormState, formData: FormData): Promise<FormState> {
    return Sentry.startSpan(
        {
            op: "function",
            name: "addCustomer",
        },
        async (span) => {
            const phone = formData.get('phone') as string;
            await checkRateLimit(phone || 'anon', 'addCustomer', { limit: 5 });

            const rawData = {
                name: formData.get('name'),
                email: formData.get('email'),
                phone: formData.get('phone'),
                address: formData.get('address'),
                fatherName: formData.get('fatherName'),
                village: formData.get('village'),
            };
            span.setAttribute("customerName", rawData.name as string);

            const validatedFields = NewCustomerSchema.safeParse(rawData);

            if (!validatedFields.success) {
                const error = validatedFields.error.flatten().fieldErrors;
                const message = Object.values(error).flat().join(', ');
                logger.warn("Customer validation failed", { errors: error });
                return { message: `Invalid data: ${message}`, success: false, data: rawData };
            }

            const { email, fatherName, village, ...rest } = validatedFields.data;

            // Auto-Create Auth User Logic
            let linkedUserId = undefined;
            if (rest.phone && /^\d{10}$/.test(rest.phone)) {
                 try {
                     const { createAdminClient } = await import('@/utils/supabase/admin');
                     const supabaseAdmin = createAdminClient();
                     const dummyEmail = `${rest.phone}@rentapp.local`;
                     
                     // Check if user already exists
                     const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
                     const existingUser = existingUsers.users.find(u => u.email === dummyEmail);

                     if (existingUser) {
                         linkedUserId = existingUser.id;
                         logger.info("Linked to existing auth user", { userId: linkedUserId });
                     } else {
                         const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
                             email: dummyEmail,
                             password: '123456',
                             email_confirm: true,
                             user_metadata: { 
                                 full_name: rest.name, 
                                 role: 'customer',
                                 phone_number: rest.phone
                             }
                         });

                         if (createError) {
                             logger.error("Failed to auto-create auth user", { error: createError.message });
                         } else if (newUser.user) {
                             linkedUserId = newUser.user.id;
                             logger.info("Auto-created auth user", { userId: linkedUserId });
                         }
                     }
                 } catch (e) {
                     logger.error("Error in auto-auth creation", { error: e });
                 }
            }

            const newCustomer = {
                ...rest,
                id: `CUST-${Date.now()}`,
                email: email ?? '',
                fatherName: fatherName ?? '',
                village: village ?? '',
                linkedUserId: linkedUserId
            };
            
            try {
                await saveCustomer(newCustomer);
                revalidatePath('/customers');
                revalidatePath('/inflow');
                logger.info("Customer added successfully", { customerId: newCustomer.id });
                return { message: 'Customer added successfully.', success: true };
            } catch (error: any) {
                Sentry.captureException(error);
                logger.error("Failed to add customer", { error: error.message });
                return { message: `Failed to add customer: ${error.message}`, success: false, data: rawData };
            }
        }
    );
}

const CustomerSchema = z.object({
    name: z.string().min(3, 'Name must be at least 3 characters.'),
    phone: z.string().min(10, 'Phone number must be at least 10 digits.'),
    address: z.string().min(5, 'Address must be at least 5 characters.'),
    email: z.string().optional(),
    fatherName: z.string().optional(),
    village: z.string().optional(),
});

/**
 * Update Customer
 */
export async function updateCustomer(customerId: string, formData: FormData): Promise<FormState> {
    return Sentry.startSpan(
        {
            op: "function",
            name: "updateCustomer",
        },
        async (span) => {
            await checkRateLimit(customerId || 'anon', 'updateCustomer', { limit: 10 });
            span.setAttribute("customerId", customerId);

            const supabase = await createClient();
            const warehouseId = await getUserWarehouse();

            if (!warehouseId) {
                return { message: 'No warehouse found for user', success: false };
            }

            const rawData = {
                name: formData.get('name'),
                phone: formData.get('phone'),
                email: formData.get('email'),
                address: formData.get('address'),
                fatherName: formData.get('fatherName'),
                village: formData.get('village'),
            };

            const validatedFields = CustomerSchema.safeParse(rawData);

            if (!validatedFields.success) {
                const errors = validatedFields.error.flatten().fieldErrors;
                const message = Object.values(errors).flat().join(', ');
                return { message: `Invalid data: ${message}`, success: false };
            }

            // Transform to database column names (snake_case)
            const updateData = {
                name: validatedFields.data.name,
                phone: validatedFields.data.phone,
                email: validatedFields.data.email || '',
                address: validatedFields.data.address,
                father_name: validatedFields.data.fatherName || '',
                village: validatedFields.data.village || ''
            };

            const { data, error } = await supabase
                .from('customers')
                .update(updateData)
                .eq('id', customerId)
                .eq('warehouse_id', warehouseId)
                .select()
                .single();

            if (error) {
                logError(error, { 
                    operation: 'update_customer', 
                    warehouseId, 
                    metadata: { customerId, updateData } 
                });
                return { message: `Failed to update customer: ${error.message}`, success: false };
            }

            revalidatePath('/customers');
            revalidatePath(`/customers/${customerId}`);
            return { message: 'Customer updated successfully!', success: true };
        }
    );
}

/**
 * Delete Customer (only if no storage records exist)
 */
export async function deleteCustomer(customerId: string): Promise<FormState> {
    return Sentry.startSpan(
        {
            op: "function",
            name: "deleteCustomer",
        },
        async (span) => {
            await checkRateLimit(customerId || 'anon', 'deleteCustomer', { limit: 5 });
            span.setAttribute("customerId", customerId);

            const supabase = await createClient();
            const warehouseId = await getUserWarehouse();

            if (!warehouseId) {
                return { message: 'No warehouse found for user', success: false };
            }

            // Check if customer has any storage records
            const { data: records, error: checkError } = await supabase
                .from('storage_records')
                .select('id')
                .eq('customer_id', customerId)
                .limit(1);

            if (checkError) {
                logError(checkError, { operation: 'check_customer_records', warehouseId, metadata: { customerId } });
                return { message: 'Failed to check customer records', success: false };
            }

            if (records && records.length > 0) {
                return { 
                    message: 'Cannot delete customer with existing storage records. This preserves your audit trail.', 
                    success: false 
                };
            }

            // Delete customer
            const { error } = await supabase
                .from('customers')
                .delete()
                .eq('id', customerId)
                .eq('warehouse_id', warehouseId);

            if (error) {
                logError(error, { operation: 'delete_customer', warehouseId, metadata: { customerId } });
                return { message: 'Failed to delete customer', success: false };
            }

            revalidatePath('/customers');
            redirect('/customers');
        }
    );
}

export async function changePassword(prevState: FormState, formData: FormData): Promise<FormState> {
    return Sentry.startSpan(
        {
            op: "function",
            name: "changePassword",
        },
        async (span) => {
            const password = formData.get('password') as string;
            const confirmPassword = formData.get('confirmPassword') as string;

            // Simple anonymous rate limit for password changes by IP (effectively)
            await checkRateLimit('anon-pwd', 'changePassword', { limit: 3 });

            if (!password || !confirmPassword) {
                return { message: 'Please fill in all fields', success: false };
            }

            if (password !== confirmPassword) {
                return { message: 'Passwords do not match', success: false };
            }

            if (password.length < 6) {
                return { message: 'Password must be at least 6 characters', success: false };
            }

            const supabase = await createClient();
            const { error } = await supabase.auth.updateUser({ password: password });

            if (error) {
                logger.error("Password change failed", { error: error.message });
                return { message: error.message, success: false };
            }

            logger.info("Password updated successfully");
            return { message: 'Password updated successfully', success: true };
        }
    );
}

const FinalizeDryingSchema = z.object({
    recordId: z.string(),
    finalBags: z.coerce.number().positive(),
});

export async function finalizePlotDrying(prevState: FormState, formData: FormData) {
    const validatedFields = FinalizeDryingSchema.safeParse({
        recordId: formData.get('recordId'),
        finalBags: formData.get('finalBags'),
    });

    const hamaliPayable = Number(formData.get('hamaliPayable') || 0);

    if (!validatedFields.success) {
        return { message: "Invalid data", success: false };
    }

    const { recordId, finalBags } = validatedFields.data;
    const record = await getStorageRecord(recordId);

    if (!record || record.inflowType !== 'Plot') {
        return { message: "Invalid record for drying finalization", success: false };
    }

    const supabase = await createClient();
    
    // Update Lot Stock
    // Logic: 
    // 1. We are converting Plot Bags -> Load Bags (Final Bags)
    // 2. The physical space used in lot changes from Plot Bags count to Final Bags count.
    // 3. Loss = Plot Bags - Final Bags. We need to free up this space.
    // However, lot.current_stock currently holds 'bags_stored' which IS 'plotBags' for this record.
    // So we just need to subtract the difference (loss) from lot stock.
    // Or simpler: remove old bags_stored from lot, add new finalBags to lot.
    
    if (record.lotId) {
         const { data: lot } = await supabase.from('warehouse_lots').select('current_stock').eq('id', record.lotId).single();
         if (lot) {
             const oldStock = lot.current_stock || 0;
             const loss = (record.bagsStored || 0) - finalBags;
             const newStock = Math.max(0, oldStock - loss);
             
             await supabase.from('warehouse_lots').update({ current_stock: newStock }).eq('id', record.lotId);
         }
    }
    
    // Update Record 
    // We update bags_stored to finalBags.
    await updateStorageRecord(recordId, {
        loadBags: finalBags,
        bagsStored: finalBags,
        bagsIn: finalBags, // Sync bagsIn
        hamaliPayable: hamaliPayable // Update Hamali
    });

    // Send SMS logic
    const sendSms = formData.get('sendSms') === 'true';
    if (sendSms) {
        const { sendDryingConfirmationSMS } = await import('@/lib/sms-event-actions');
        // We pass true to bypassSettings? No, user said "only if inflow sms option is enabled".
        // My implementation of sendDryingConfirmationSMS CHECKS the setting.
        // So passing 'true' to bypassSettings would IGNORE the setting.
        // I should pass 'false' (default) or not pass it, relying on internal check.
        // But wait, the checkbox is "user intent". The setting is "global config".
        // Logic: specific action (Checkbox) AND global config (Setting).
        // My function `sendDryingConfirmationSMS` checks setting unless `bypassSettings` is true.
        // So I should call it with `false` (default) so it respects the setting.
        // BUT if I want the checkbox to be the ONLY gate if setting is ON...
        // Yes, call with `false`.
        // However, if the setting is OFF, the SMS won't send even if Checkbox is ON. This is correct behavior per "add that condition too".
        
        await sendDryingConfirmationSMS(recordId);
    }

    revalidatePath('/storage');
    return { message: `Drying finalized. Stock updated to ${finalBags} bags.`, success: true, recordId };
}

const InflowSchema = z.object({
    customerId: z.string().min(1, 'Customer is required.'),
    commodityDescription: z.string().min(2, 'Commodity description is required.'),
    location: z.string().optional(), // Now optional as we prefer lotId
    storageStartDate: z.string().refine(val => !isNaN(Date.parse(val)), { message: "Invalid date format" }),
    bagsStored: z.coerce.number().int().nonnegative('Number of bags must be a non-negative number.').optional(),
    hamaliRate: z.coerce.number().nonnegative('Hamali rate must be a non-negative number.').optional(),
    hamaliPaid: z.coerce.number().nonnegative('Hamali paid must be a non-negative number.').optional(),
    lorryTractorNo: z.string().optional(),
    // For updating customer details from inflow form
    fatherName: z.string().optional(),
    village: z.string().optional(),
    inflowType: z.enum(['Direct', 'Plot']).optional(),
    plotBags: z.coerce.number().nonnegative('Plot bags must be a non-negative number.').optional(),
    loadBags: z.coerce.number().optional(),
    khataAmount: z.coerce.number().nonnegative('Khata amount must be a non-negative number.').optional(),
    lotId: z.string().min(1, 'Lot selection is required.'),
    cropId: z.string().min(1, 'Crop selection is required.'),
});

export type InflowFormState = {
    message: string;
    success: boolean;
    data?: Record<string, any>;
};

export async function addInflow(prevState: InflowFormState, formData: FormData): Promise<InflowFormState> {
    return Sentry.startSpan(
        {
            op: "function",
            name: "addInflow",
        },
        async (span) => {
            const customerId = formData.get('customerId') as string;
            await checkRateLimit(customerId || 'anon', 'addInflow', { limit: 10 });

            const rawData = {
                customerId: formData.get('customerId'),
                commodityDescription: formData.get('commodityDescription'),
                location: formData.get('location'),
                storageStartDate: formData.get('storageStartDate'),
                bagsStored: formData.get('bagsStored'),
                hamaliRate: formData.get('hamaliRate'),
                hamaliPaid: formData.get('hamaliPaid'),
                lorryTractorNo: formData.get('lorryTractorNo'),
                fatherName: formData.get('fatherName'),
                village: formData.get('village'),
                inflowType: formData.get('inflowType'),
                plotBags: formData.get('plotBags'),
                loadBags: formData.get('loadBags'),
                khataAmount: formData.get('khataAmount'),
                lotId: formData.get('lotId'),
                cropId: formData.get('cropId'),
                unloadingRecordId: formData.get('unloadingRecordId'),
            };
            span.setAttribute("customerId", rawData.customerId as string);
            span.setAttribute("lotId", rawData.lotId as string);

            const validatedFields = InflowSchema.safeParse(rawData);

            if (!validatedFields.success) {
                const error = validatedFields.error.flatten().fieldErrors;
                const message = Object.values(error).flat().join(', ');
                logger.warn("Inflow validation failed", { errors: error });
                return { message: `Invalid data: ${message}`, success: false, data: rawData };
            }

            let { bagsStored, hamaliRate, hamaliPaid, storageStartDate, fatherName, village, plotBags, loadBags, inflowType, ...rest } = validatedFields.data;

            // Update customer if father's name or village was changed
            if (fatherName || village) {
                const customer = await getCustomer(rest.customerId);
                if (customer) {
                    const customerUpdate: Partial<typeof customer> = {};
                    if (fatherName && customer.fatherName !== fatherName) customerUpdate.fatherName = fatherName;
                    if (village && customer.village !== village) customerUpdate.village = village;
                    if (Object.keys(customerUpdate).length > 0) {
                        logger.debug("Plan to update customer details during inflow", { customerId: rest.customerId, updates: customerUpdate });
                        // This assumes an `updateCustomer` function exists in data.ts
                        // await updateCustomer(rest.customerId, customerUpdate);
                    }
                }
            }

            try {
                let inflowBags = 0;
                if (inflowType === 'Plot') {
                    if (!plotBags || plotBags <= 0) {
                        logger.warn("Invalid plot bags for plot inflow", { customerId: rest.customerId });
                        return { message: "Plot Bags must be a positive number for 'Plot' inflow.", success: false };
                    }
                    inflowBags = plotBags;
                } else { // 'Direct'
                    if (!bagsStored || bagsStored <= 0) {
                        logger.warn("Invalid bags stored for direct inflow", { customerId: rest.customerId });
                        return { message: "Number of Bags must be a positive number for 'Direct' inflow.", success: false };
                    }
                    inflowBags = bagsStored;
                }
                span.setAttribute("inflowBags", inflowBags);

                // Capacity Check & Location Fetch
                let lotName = rest.location ?? '';
                if (rest.lotId) {
                    const supabase = await createClient();
                    const { data: lot } = await supabase.from('warehouse_lots').select('capacity, current_stock, name').eq('id', rest.lotId).single();
                    
                    if (lot) {
                        lotName = lot.name; // Securely get location name
                        const capacity = lot.capacity || 1000;
                        const current = lot.current_stock || 0;
                        const available = capacity - current;
                        
                        if (inflowBags > available) {
                            logger.warn("Lot capacity exceeded during inflow", { lotId: rest.lotId, requested: inflowBags, available });
                            return { 
                                message: `Lot is full! Available: ${available} bags. You tried to add ${inflowBags}.`, 
                                success: false,
                                data: rawData
                            };
                        }
                    }
                }

                // Calculate Hamali Payable (Inflow + Unloading Carry-over)
                let hamaliPayable = inflowBags * (hamaliRate || 0);

                // Add proportionate share from Unloading Record if selected
                if (rawData.unloadingRecordId && rawData.unloadingRecordId !== '_none_') {
                    const supabase = await createClient();
                    const { data: uRecord } = await supabase
                        .from('unloading_records')
                        .select('hamali_amount, bags_unloaded')
                        .eq('id', rawData.unloadingRecordId)
                        .single();
                    
                    if (uRecord && uRecord.hamali_amount && uRecord.bags_unloaded > 0) {
                        const costPerBag = uRecord.hamali_amount / uRecord.bags_unloaded;
                        const carryOverAmount = costPerBag * inflowBags;
                        hamaliPayable += carryOverAmount;
                        logger.info("Added unloading hamali carry-over", { 
                            inflowBags, 
                            costPerBag, 
                            carryOverAmount,
                            totalHamali: hamaliPayable 
                        });
                    }
                }
                const payments: Payment[] = [];
                if (hamaliPaid && hamaliPaid > 0) {
                    payments.push({ amount: hamaliPaid, date: new Date(storageStartDate), type: 'hamali' });
                }
                
                // Generate Invoice Number (ID)
                const newRecordId = await getNextInvoiceNumber('inflow');

                // Ensure 0 is treated as undefined for optional DB fields if they prefer NULL
                const finalPlotBags = (plotBags && plotBags > 0) ? plotBags : undefined;
                const finalLoadBags = (loadBags && loadBags > 0) ? loadBags : undefined;

                const newRecord: StorageRecord = {
                    ...rest,
                    id: newRecordId,
                    bagsIn: inflowBags,
                    bagsOut: 0,
                    bagsStored: inflowBags,
                    storageStartDate: new Date(storageStartDate),
                    storageEndDate: null,
                    billingCycle: '6-Month Initial',
                    payments: payments,
                    hamaliPayable: hamaliPayable,
                    totalRentBilled: 0,
                    lorryTractorNo: rest.lorryTractorNo ?? '',
                    inflowType: inflowType ?? 'Direct',
                    plotBags: finalPlotBags,
                    loadBags: finalLoadBags,
                    location: lotName, // Use trusted name
                    khataAmount: rest.khataAmount ?? 0,
                    lotId: rest.lotId,
                    cropId: rest.cropId,
                    notes: (rawData.unloadingRecordId && rawData.unloadingRecordId !== '_none_')
                        ? `Quick Inflow. Hamali: ₹${inflowBags * (hamaliRate || 0)} (Inflow) + ₹${Math.round(hamaliPayable - (inflowBags * (hamaliRate || 0)))} (Unloading Share).`
                        : undefined,
                };

                const savedRecord = await saveStorageRecord(newRecord);

                const { logActivity, createNotification } = await import('@/lib/logger');
                await logActivity('CREATE', 'StorageRecord', savedRecord.id, { 
                    customerId: rest.customerId, 
                    bags: inflowBags, 
                    commodity: rest.commodityDescription 
                });


                // Update Lot Capacity Manually (Reliability Fix)
                if (rest.lotId) {
                    const supabase = await createClient();
                    const { data: lotToUpdate } = await supabase.from('warehouse_lots').select('current_stock').eq('id', rest.lotId).single();
                    if (lotToUpdate) {
                        const newStock = (lotToUpdate.current_stock || 0) + inflowBags;
                        await supabase.from('warehouse_lots').update({ current_stock: newStock }).eq('id', rest.lotId);
                    }
                }
                
                // Deduct from unloading record if applicable
                const unloadingRecordId = rawData.unloadingRecordId as string | null;
                if (unloadingRecordId && unloadingRecordId !== '_none_') {
                    const supabase = await createClient();
                    
                    // Get current unloading record
                    const { data: unloadingRecord } = await supabase
                        .from('unloading_records')
                        .select('bags_remaining')
                        .eq('id', unloadingRecordId)
                        .single();
                    
                    if (unloadingRecord) {
                        const newRemaining = Math.max(0, unloadingRecord.bags_remaining - inflowBags);
                        
                        // Update bags_remaining
                        await supabase
                            .from('unloading_records')
                            .update({ 
                                bags_remaining: newRemaining,
                                updated_at: new Date().toISOString()
                            })
                            .eq('id', unloadingRecordId);
                        
                        logger.info("Deducted bags from unloading record", { 
                            unloadingRecordId, 
                            deducted: inflowBags, 
                            newRemaining 
                        });
                    }
                }
                
                // Check for Low Capacity Warning (>90%)
                if (rest.lotId) {
                    // Re-init supabase if needed or reuse if available in wider scope (it wasn't)
                    const supabase = await createClient();
                    // Fetch fresh lot data to be accurate
                    const { data: currentLot } = await supabase.from('warehouse_lots').select('id, name, capacity, current_stock').eq('id', rest.lotId).single();
                    
                    if (currentLot && currentLot.capacity && currentLot.capacity > 0) {
                         const stock = currentLot.current_stock || 0;
                         const percentage = (stock / currentLot.capacity) * 100;
                         
                         if (percentage >= 90) {
                             logger.info("High lot utilization detected", { lotId: rest.lotId, percentage });
                             await createNotification(
                                'High Utilization Alert',
                                `Lot ${currentLot.name || currentLot.id} is ${percentage.toFixed(1)}% full (${stock}/${currentLot.capacity} bags). Consider using a new lot soon.`,
                                'warning',
                                undefined,
                                '/settings/lots'
                             );
                         }
                    }
                }
                const customerForNotif = await getCustomer(rest.customerId);
                const customerName = customerForNotif?.name || "Unknown Customer";

                await createNotification(
                    'Inflow Recorded', 
                    `Received ${inflowBags} bags of ${rest.commodityDescription} from ${customerName}`, 
                    'success',
                    undefined, // Warehouse-wide
                    `/inflow/receipt/${savedRecord.id}`
                );

                // Send SMS Notification
                const sendSms = formData.get('sendSms') === 'true';
                if (sendSms) {
                    const { sendInflowWelcomeSMS } = await import('@/lib/sms-event-actions');
                    await sendInflowWelcomeSMS(savedRecord.id, true);
                }

                logger.info("Inflow record created successfully", { recordId: savedRecord.id });
                revalidatePath('/storage');
                redirect(`/inflow/receipt/${savedRecord.id}`);
            } catch (error: any) {
                if (error.message === 'NEXT_REDIRECT') throw error;
                Sentry.captureException(error);
                logger.error('Add Inflow Error:', { error: error.message, customerId: rest.customerId });
                return { message: `Failed to create record: ${error.message || 'Unknown error'}`, success: false, data: rawData };
            }
        }
    );
}


const OutflowSchema = z.object({
    recordId: z.string().min(1, 'A storage record must be selected.'),
    bagsToWithdraw: z.coerce.number().int().positive('Bags to withdraw must be a positive number.'),
    withdrawalDate: z.string().refine(val => !isNaN(Date.parse(val)), { message: "Invalid date format" }),
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

            const isFullWithdrawal = bagsToWithdraw === originalRecord.bagsStored;
            const paymentMade = amountPaidNow || 0;
            
            const recordUpdate: Partial<StorageRecord> = {
                bagsStored: originalRecord.bagsStored - bagsToWithdraw,
                bagsOut: (originalRecord.bagsOut || 0) + bagsToWithdraw,

            };

            try {
                if (paymentMade > 0) {
                    // Explicitly save the payment as updateStorageRecord doesn't handle relation updates
                    const { addPaymentToRecord } = await import('@/lib/data');
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

                if (isFullWithdrawal) {
                    recordUpdate.storageEndDate = new Date(withdrawalDate);
                    recordUpdate.billingCycle = 'Completed';
                }

                recordUpdate.totalRentBilled = (originalRecord.totalRentBilled || 0) + finalRent;
                
                await updateStorageRecord(recordId, recordUpdate);

                // Update Lot Capacity Manually (Reliability Fix)
                if (originalRecord.lotId) {
                    const supabase = await createClient();
                    const { data: lotToUpdate } = await supabase.from('warehouse_lots').select('current_stock').eq('id', originalRecord.lotId).single();
                    if (lotToUpdate) {
                        const newStock = Math.max(0, (lotToUpdate.current_stock || 0) - bagsToWithdraw);
                        await supabase.from('warehouse_lots').update({ current_stock: newStock }).eq('id', originalRecord.lotId);
                    }
                }

                // Save Withdrawal Transaction Audit
                const { saveWithdrawalTransaction } = await import('@/lib/data');
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

const StorageRecordUpdateSchema = z.object({
  customerId: z.string().min(1, 'Customer is required.'),
  commodityDescription: z.string().min(2, 'Commodity description is required.'),
  location: z.string().min(1, 'Location is required.'),
  bagsStored: z.coerce.number().int().positive('Bags must be a positive number.'),
  hamaliPayable: z.coerce.number().nonnegative('Hamali charges must be a non-negative number.'),
  storageStartDate: z.string().refine(val => !isNaN(Date.parse(val)), { message: "Invalid date format" }),
  cropId: z.string().optional(),
});


export async function updateStorageRecordAction(recordId: string, prevState: InflowFormState, formData: FormData): Promise<InflowFormState> {
    const rawData = {
        customerId: formData.get('customerId'),
        commodityDescription: formData.get('commodityDescription'),
        location: formData.get('location'),
        bagsStored: formData.get('bagsStored'),
        hamaliPayable: formData.get('hamaliPayable'),
        storageStartDate: formData.get('storageStartDate'),
        cropId: formData.get('cropId'),
    };

    const validatedFields = StorageRecordUpdateSchema.safeParse(rawData);

    if (!validatedFields.success) {
        const error = validatedFields.error.flatten().fieldErrors;
        const message = Object.values(error).flat().join(', ');
        return { message: `Invalid data: ${message}`, success: false, data: rawData };
    }
    
    const originalRecord = await getStorageRecord(recordId);
    if (!originalRecord) {
        return { message: 'Record not found.', success: false, data: rawData };
    }

    const { bagsStored, ...rest } = validatedFields.data;

    const dataToUpdate: Partial<StorageRecord> = {
        ...rest,
        bagsIn: bagsStored,
        bagsStored: bagsStored - (originalRecord.bagsOut || 0), // Recalculate balance
        storageStartDate: new Date(validatedFields.data.storageStartDate)
    };

    await updateStorageRecord(recordId, dataToUpdate);

    revalidatePath('/storage');
    revalidatePath('/payments/pending');
    revalidatePath('/reports');
    return { message: 'Record updated successfully.', success: true };
}

/**
 * Simple Storage Record Update (for UI)
 */
export async function updateStorageRecordSimple(recordId: string, formData: {
    commodityDescription: string;
    location: string;
    bagsStored: number;
    hamaliPayable: number;
    storageStartDate: string;
    // Extended fields for Admin
    customerId?: string;
    cropId?: string;
    lotId?: string;
    lorryTractorNo?: string;
    inflowType?: 'Direct' | 'Plot';
}) {
    const supabase = await createClient();
    const warehouseId = await getUserWarehouse();

    if (!warehouseId) {
        return { message: 'No warehouse found for user', success: false };
    }

    // Check if record is completed
    const { data: record } = await supabase
        .from('storage_records')
        .select('storage_end_date')
        .eq('id', recordId)
        .single();

    if (record?.storage_end_date) {
        return { message: 'Cannot edit completed records', success: false };
    }

    // Transform to database column names
    const updateData: any = {
        commodity_description: formData.commodityDescription,
        location: formData.location,
        bags_stored: formData.bagsStored,
        hamali_payable: formData.hamaliPayable,
        storage_start_date: new Date(formData.storageStartDate),
    };

    // Add extended fields if present
    if (formData.customerId) updateData.customer_id = formData.customerId;
    if (formData.cropId) updateData.crop_id = formData.cropId;
    if (formData.lotId) updateData.lot_id = formData.lotId;
    if (formData.lorryTractorNo !== undefined) updateData.lorry_tractor_no = formData.lorryTractorNo; // Allow clearing
    if (formData.inflowType) updateData.inflow_type = formData.inflowType;

    const { error } = await supabase
        .from('storage_records')
        .update(updateData)
        .eq('id', recordId)
        .eq('warehouse_id', warehouseId);

    if (error) {
        logError(error, { operation: 'update_storage_record', warehouseId, metadata: { recordId } });
        return { message: `Failed to update record: ${error.message}`, success: false };
    }

    revalidatePath('/storage');
    revalidatePath('/payments/pending');
    revalidatePath('/reports');
    return { message: 'Record updated successfully!', success: true };
}


const PaymentSchema = z.object({
  recordId: z.string(),
  paymentAmount: z.coerce.number().positive('Payment amount must be a positive number.'),
  paymentDate: z.string().refine(val => !isNaN(Date.parse(val)), { message: "Invalid date format" }),
  paymentType: z.enum(['Rent/Other', 'Hamali']),
});

export type PaymentFormState = {
    message: string;
    success: boolean;
    data?: Record<string, any>;
};

export async function addPayment(prevState: PaymentFormState, formData: FormData): Promise<PaymentFormState> {
    return Sentry.startSpan(
        {
            op: "function",
            name: "addPayment",
        },
        async (span) => {
            const rawData = {
                recordId: formData.get('recordId'),
                paymentAmount: formData.get('paymentAmount'),
                paymentDate: formData.get('paymentDate'),
                paymentType: formData.get('paymentType'),
            };
            span.setAttribute("recordId", rawData.recordId as string);

            const validatedFields = PaymentSchema.safeParse(rawData);

            if (!validatedFields.success) {
                const error = validatedFields.error.flatten().fieldErrors;
                const message = Object.values(error).flat().join(', ');
                logger.warn("Payment validation failed", { errors: error });
                return { message: `Invalid data: ${message}`, success: false, data: rawData };
            }
            
            const { recordId, paymentAmount, paymentDate, paymentType } = validatedFields.data;
            span.setAttribute("paymentAmount", paymentAmount);
            
            const record = await getStorageRecord(recordId);
            if (!record) {
                logger.error("Storage record not found for payment", { recordId });
                return { message: 'Record not found.', success: false, data: rawData };
            }

            try {
                if (paymentType === 'Hamali') {
                    const payment: Payment = {
                        amount: paymentAmount,
                        date: new Date(paymentDate),
                        type: 'hamali',
                        notes: 'Hamali Payment'
                    };
                    await addPaymentToRecord(recordId, payment);
                } else {
                    // This is a payment against the outstanding balance.
                    const payment: Payment = {
                        amount: paymentAmount,
                        date: new Date(paymentDate),
                        type: 'rent',
                        notes: 'Rent Payment'
                    };
                    await addPaymentToRecord(recordId, payment);
                }
                
                const { createNotification } = await import('@/lib/logger');
                
                // Fetch customer    
                const customer = await getCustomer(record.customerId);
                if (customer) {
                    const paymentTypeLabel = paymentType === 'Hamali' ? 'Hamali' : 'Rent/Storage';
                    await createNotification(
                        'Payment Received',
                        `Payment of ₹${paymentAmount} received from ${customer.name} for ${paymentTypeLabel}`,
                        'info'
                    );
                }
                
                logger.info("Payment recorded successfully", { recordId, amount: paymentAmount, type: paymentType });
                revalidatePath('/customers');
                revalidatePath('/payments/pending');
                revalidatePath(`/customers/${record.customerId}`);
                return { message: 'Payment recorded successfully!', success: true };
            } catch (error: any) {
                Sentry.captureException(error);
                logger.error("Failed to record payment", { error: error.message, recordId });
                return { message: `Failed to record payment: ${error.message}`, success: false, data: rawData };
            }
        }
    );
}

/**
 * Update Payment
 */
export async function updatePayment(paymentId: string, formData: FormData) {
    const supabase = await createClient();
    const warehouseId = await getUserWarehouse();

    if (!warehouseId) {
        return { message: 'No warehouse found for user', success: false };
    }

    const amount = parseFloat(formData.get('amount') as string);
    const date = formData.get('date') as string;
    const type = formData.get('type') as string;
    const notes = formData.get('notes') as string;
    const customerId = formData.get('customerId') as string;

    if (!amount || amount <= 0) {
        return { message: 'Invalid payment amount', success: false };
    }

    // Transform to database column names
    const updateData = {
        amount,
        payment_date: new Date(date),
        type,
        notes: notes || ''
    };

    const { data, error } = await supabase
        .from('payments')
        .update(updateData)
        .eq('id', paymentId)
        .select()
        .single();

    if (error) {
        logError(error, { operation: 'update_payment', metadata: { paymentId } });
        return { message: `Failed to update payment: ${error.message}`, success: false };
    }

    revalidatePath('/customers');
    revalidatePath('/payments/pending');
    revalidatePath(`/customers/${customerId}`);
    return { message: 'Payment updated successfully!', success: true };
}

/**
 * Delete Payment
 */
export async function deletePayment(paymentId: string, customerId: string) {
    const supabase = await createClient();
    const warehouseId = await getUserWarehouse();

    if (!warehouseId) {
        return { message: 'No warehouse found for user', success: false };
    }

    const { error } = await supabase
        .from('payments')
        .delete()
        .eq('id', paymentId);

    if (error) {
        logError(error, { operation: 'delete_payment', metadata: { paymentId } });
        return { message: 'Failed to delete payment', success: false };
    }

    revalidatePath('/customers');
    revalidatePath('/payments/pending');
    revalidatePath(`/customers/${customerId}`);
    return { message: 'Payment deleted successfully!', success: true };
}

export async function deleteStorageRecordAction(recordId: string): Promise<FormState> {
  try {
    await deleteStorageRecord(recordId);
    revalidatePath('/reports');
    revalidatePath('/storage');
    revalidatePath('/payments/pending');
    return { message: 'Record deleted successfully.', success: true };
  } catch (error: any) {
    return { message: error.message || 'Failed to delete record.', success: false };
  }
}

export async function restoreStorageRecordAction(recordId: string): Promise<FormState> {
  try {
    await restoreStorageRecord(recordId);
    revalidatePath('/reports');
    revalidatePath('/storage');
    revalidatePath('/payments/pending');
    return { message: 'Record restored successfully.', success: true };
  } catch (error: any) {
    return { message: error.message || 'Failed to restore record.', success: false };
  }
}

const ExpenseSchema = z.object({
  description: z.string().min(2, 'Description is required.'),
  amount: z.coerce.number().positive('Amount must be a positive number.'),
  date: z.string().refine(val => !isNaN(Date.parse(val)), { message: "Invalid date format" }),
  category: z.enum(expenseCategories, { required_error: 'Category is required.' }),
});

export async function addExpense(prevState: FormState, formData: FormData): Promise<FormState> {
    const rawData = {
        description: formData.get('description'),
        amount: formData.get('amount'),
        date: formData.get('date'),
        category: formData.get('category'),
    };

    const validatedFields = ExpenseSchema.safeParse(rawData);

    if (!validatedFields.success) {
        const error = validatedFields.error.flatten().fieldErrors;
        const message = Object.values(error).flat().join(', ');
        return { message: `Invalid data: ${message}`, success: false, data: rawData };
    }

    const newExpense = {
        ...validatedFields.data,
        id: `EXP-${Date.now()}`,
        date: new Date(validatedFields.data.date),
    };

    await saveExpense(newExpense);

    revalidatePath('/expenses');
    return { message: 'Expense added successfully.', success: true };
}

export async function updateExpenseAction(expenseId: string, prevState: FormState, formData: FormData): Promise<FormState> {
  const validatedFields = ExpenseSchema.safeParse({
    description: formData.get('description'),
    amount: formData.get('amount'),
    date: formData.get('date'),
    category: formData.get('category'),
  });

  if (!validatedFields.success) {
    const error = validatedFields.error.flatten().fieldErrors;
    const message = Object.values(error).flat().join(', ');
    return { message: `Invalid data: ${message}`, success: false };
  }
  
  const dataToUpdate = {
    ...validatedFields.data,
    date: new Date(validatedFields.data.date),
  };

  try {
    await updateExpense(expenseId, dataToUpdate);
    revalidatePath('/expenses');
    return { message: 'Expense updated successfully.', success: true };
  } catch (error) {
    return { message: 'Failed to update expense.', success: false };
  }
}

/**
 * Simple Expense Update (for UI)
 */
export async function updateExpenseSimple(expenseId: string, formData: FormData) {
  const supabase = await createClient();
  const warehouseId = await getUserWarehouse();

  if (!warehouseId) {
    return { message: 'No warehouse found for user', success: false };
  }

  const validatedFields = ExpenseSchema.safeParse({
    description: formData.get('description'),
    amount: formData.get('amount'),
    date: formData.get('date'),
    category: formData.get('category'),
  });

  if (!validatedFields.success) {
    const error = validatedFields.error.flatten().fieldErrors;
    const message = Object.values(error).flat().join(', ');
    return { message: `Invalid data: ${message}`, success: false };
  }

  // Transform to database column names
  const updateData = {
    description: validatedFields.data.description,
    amount: validatedFields.data.amount,
    category: validatedFields.data.category,
    expense_date: new Date(validatedFields.data.date)
  };

  const { error } = await supabase
    .from('expenses')
    .update(updateData)
    .eq('id', expenseId)
    .eq('warehouse_id', warehouseId);

  if (error) {
    logError(error, { operation: 'update_expense', warehouseId, metadata: { expenseId } });
    return { message: `Failed to update expense: ${error.message}`, success: false };
  }

  revalidatePath('/expenses');
  revalidatePath('/reports');
  return { message: 'Expense updated successfully!', success: true };
}

/**
 * Delete Expense
 */
export async function deleteExpenseSimple(expenseId: string) {
  const supabase = await createClient();
  const warehouseId = await getUserWarehouse();

  if (!warehouseId) {
    return { message: 'No warehouse found for user', success: false };
  }

  const { error } = await supabase
    .from('expenses')
    .delete()
    .eq('id', expenseId)
    .eq('warehouse_id', warehouseId);

  if (error) {
    logError(error, { operation: 'delete_expense', warehouseId, metadata: { expenseId } });
    return { message: 'Failed to delete expense', success: false };
  }

  revalidatePath('/expenses');
  revalidatePath('/reports');
  return { message: 'Expense deleted successfully!', success: true };
}
    

export async function deleteExpenseAction(expenseId: string): Promise<FormState> {
  try {
    await deleteExpense(expenseId);
    revalidatePath('/expenses');
    return { message: 'Expense deleted successfully.', success: true };
  } catch (error) {
    return { message: 'Failed to delete expense.', success: false };
  }
}
    

const TeamMemberSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6, 'Password must be at least 6 characters.'),
  fullName: z.string().min(2, 'Name is required.'),
  role: z.enum(['admin', 'manager', 'staff']),
});

export async function createTeamMember(prevState: FormState, formData: FormData): Promise<FormState> {
  const validatedFields = TeamMemberSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
    fullName: formData.get('fullName'),
    role: formData.get('role'),
  });

  if (!validatedFields.success) {
    const error = validatedFields.error.flatten().fieldErrors;
    const message = Object.values(error).flat().join(', ');
    return { 
      message: `Invalid inputs: ${message}`, 
      success: false, 
      data: { 
        email: formData.get('email'), 
        fullName: formData.get('fullName'), 
        role: formData.get('role') 
      } 
    };
  }

  const { email, password, fullName, role } = validatedFields.data;
  const warehouseId = formData.get('warehouseId') as string;

  // 1. Check if current user is logged in
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { message: 'Unauthorized', success: false };
  }

  // 2. Use Admin Client to create user
  try {
    const { createAdminClient } = await import('@/utils/supabase/admin');
    const supabaseAdmin = createAdminClient();
    
    const { data: newUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
        role: role,
        created_by: user.id
      }
    });

    if (authError) {
      return { message: authError.message, success: false };
    }
    
    // 3. Create Warehouse Assignment
    // If no warehouseId provided, use the creator's current warehouse
    let targetWarehouseId = warehouseId;
    if (!targetWarehouseId) {
        const { data: profile } = await supabase.from('profiles').select('warehouse_id').eq('id', user.id).single();
        targetWarehouseId = profile?.warehouse_id;
    }

    if (targetWarehouseId && newUser.user) {
        // 1. Create Assignment
        await supabaseAdmin.from('warehouse_assignments').insert({
            user_id: newUser.user.id,
            warehouse_id: targetWarehouseId,
            role: role
        });

        // 2. Sync Profile (Legacy Support)
        await supabaseAdmin.from('profiles').update({
            warehouse_id: targetWarehouseId
        }).eq('id', newUser.user.id);
    }

    return { message: `User ${email} created successfully!`, success: true };

  } catch (err: any) {
    console.error('Create User Error:', err);
    return { message: err.message || 'Server Error', success: false };
  }
}

const UserProfileSchema = z.object({
    fullName: z.string().min(2, "Name must be at least 2 characters."),
    phone: z.string().optional(),
});

export async function updateUserProfile(prevState: FormState, formData: FormData): Promise<FormState> {
    const validatedFields = UserProfileSchema.safeParse({
        fullName: formData.get('fullName'),
        phone: formData.get('phone'),
    });

    if (!validatedFields.success) {
        return { message: "Invalid data", success: false };
    }

    const { fullName, phone } = validatedFields.data;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { message: "Unauthorized", success: false };

    const { error } = await supabase
        .from('profiles') // Assuming you have a profiles table
        .update({ 
            full_name: fullName,
            phone: phone || null
        })
        .eq('id', user.id);

    if (error) {
        return { message: "Failed to update profile", success: false };
    }

    revalidatePath('/settings');
    return { message: "Profile updated successfully", success: true };
}


export async function updateTeamMember(userId: string, formData: FormData) {
    const role = formData.get('role') as string;
    const fullName = formData.get('fullName');
    
    const supabase = await createClient();
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    if (!currentUser) return { message: "Unauthorized", success: false };

    // 1. Get Current User Role
    const { data: currentProfile } = await supabase.from('profiles').select('role, warehouse_id').eq('id', currentUser.id).single();
    if (!currentProfile) return { message: "Profile not found", success: false };

    const currentRank = roleHierarchy[currentProfile.role] || 0;

    // 2. Get Target User Role
    const { data: targetProfile } = await supabase.from('profiles').select('role, warehouse_id').eq('id', userId).single();
    if (!targetProfile) return { message: "Target user not found", success: false };

    const targetRank = roleHierarchy[targetProfile.role] || 0;

    // 3. Check Permissions
    // Must be in same warehouse (unless Super Admin)
    if (currentProfile.role !== 'super_admin' && currentProfile.warehouse_id !== targetProfile.warehouse_id) {
        return { message: "Unauthorized: Different warehouse", success: false };
    }

    // Must have higher rank to edit (or be Owner/SuperAdmin editing anyone below)
    // Rule: You can only edit people BELOW you.
    // Exception: You can edit yourself? (Usually different action, but let's allow if logic matches)
    // If strict: currentRank > targetRank.
    if (currentRank <= targetRank) {
        return { message: "Unauthorized: Insufficient privileges to edit this user.", success: false };
    }

    // 4. Check Promoted Role Rank
    // Cannot promote someone to a rank >= your own.
    if (role) {
        const newRoleRank = roleHierarchy[role] || 0;
        if (newRoleRank >= currentRank) {
             return { message: "Unauthorized: Cannot assign a role equal to or higher than your own.", success: false };
        }
    }

    const updateData: any = {};
    if (role) updateData.role = role;
    if (fullName) updateData.full_name = fullName;

    const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', userId);

    if (error) {
        return { message: `Failed to update member: ${error.message}`, success: false };
    }

    revalidatePath('/settings/team');
    return { message: "Team member updated", success: true };
}

export async function deactivateTeamMember(userId: string) {
    const supabase = await createClient();
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    if (!currentUser) return { message: "Unauthorized", success: false };

    // 1. Get Current User Role
    const { data: currentProfile } = await supabase.from('profiles').select('role, warehouse_id').eq('id', currentUser.id).single();
    if (!currentProfile) return { message: "Profile not found", success: false };
    
    const currentRank = roleHierarchy[currentProfile.role] || 0;

    // 2. Get Target User Role
    const { data: targetProfile } = await supabase.from('profiles').select('role, warehouse_id').eq('id', userId).single();
    if (!targetProfile) return { message: "Target user not found", success: false };
    
    const targetRank = roleHierarchy[targetProfile.role] || 0;

    // 3. Permission Check
    if (currentProfile.role !== 'super_admin' && currentProfile.warehouse_id !== targetProfile.warehouse_id) {
         return { message: "Unauthorized: Different warehouse", success: false };
    }

    if (currentRank <= targetRank) {
         return { message: "Unauthorized: Insufficient privileges to deactivate this user.", success: false };
    }

    try {
        const { createAdminClient } = await import('@/utils/supabase/admin');
        const supabaseAdmin = createAdminClient();
        
        // Disable user in Auth
        const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
            user_metadata: { is_active: false }, // Mark metadata
            // ban_duration: '876600h' // Ban for 100 years?
            // Actually, best way is to delete them or remove warehouse_id
        });
        
        if (authError) throw authError;

        // Also update profile
        const { error: profileError } = await supabase.from('profiles').update({
             // is_active: false  // We don't know if this exists
             role: 'suspended' // Let's try this, or just rely on Auth ban if we implemented it fully
        }).eq('id', userId);

        revalidatePath('/settings/team');
        return { message: "Member deactivated", success: true };
    } catch (e: any) {
        return { message: `Deactivation failed: ${e.message}`, success: false };
    }
}

export async function fetchCustomers() {
    return await getCustomers();
}

export async function fetchCrops() {
    return await getAvailableCrops();
}

export async function fetchLots() {
    return await getAvailableLots();
}

export async function fetchTeamMembers() {
    return await getTeamMembers();
}

export async function fetchDashboardMetrics() {
    return await getDashboardMetrics();
}

export async function switchWarehouse(warehouseId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { success: false, message: 'Unauthorized' };
    }

    // Verify access
    const { data: membership } = await supabase
        .from('warehouse_assignments')
        .select('role')
        .eq('user_id', user.id)
        .eq('warehouse_id', warehouseId)
        .single();

    if (!membership) {
        return { success: false, message: 'You do not have access to this warehouse.' };
    }

    // Update profile's active warehouse
    const { error } = await supabase
        .from('profiles')
        .update({ 
            warehouse_id: warehouseId,
            role: membership.role 
        })
        .eq('id', user.id);

    if (error) {
        console.error('Switch Warehouse Error:', error);
        return { success: false, message: 'Failed to switch warehouse.' };
    }

    revalidatePath('/', 'layout');
    return { success: true, message: 'Switched warehouse successfully' };
}

export async function deleteOutflow(transactionId: string) {
    const supabase = await createClient();
    
    // 1. Get Transaction with explicit storage record join
    const { data: transaction, error: txError } = await supabase
        .from('withdrawal_transactions')
        .select('*, storage_record:storage_records(*)')
        .eq('id', transactionId)
        .single();
    
    if (txError || !transaction) {
        return { success: false, message: 'Transaction not found' };
    }

    const record = transaction.storage_record;
    if (!record) {
         return { success: false, message: 'Associated storage record not found' };
    }

    // 2. Prepare Updates
    const bagsRestored = transaction.bags_withdrawn;
    const rentReversed = transaction.rent_collected || 0;

    // Use snake_case for direct DB update
    const currentBagsStored = record.bags_stored;
    const currentBagsOut = record.bags_out;
    const currentTotalRent = record.total_rent_billed;

    const directUpdates: any = {
        bags_stored: currentBagsStored + bagsRestored,
        bags_out: Math.max(0, (currentBagsOut || 0) - bagsRestored),
        total_rent_billed: Math.max(0, (currentTotalRent || 0) - rentReversed)
    };
    
    // Re-open record if it was closed
    if (record.storage_end_date && directUpdates.bags_stored > 0) {
        directUpdates.storage_end_date = null;
        directUpdates.billing_cycle = 'Active';
    }

    const { error: updateError } = await supabase
        .from('storage_records')
        .update(directUpdates)
        .eq('id', record.id);

    if (updateError) {
        console.error('Failed to update storage record during revert:', updateError);
        return { success: false, message: 'Failed to update storage record' };
    }

    // 4. Delete Transaction
    const { error: delError } = await supabase
        .from('withdrawal_transactions')
        .delete()
        .eq('id', transactionId);

    if (delError) {
         return { success: false, message: 'Failed to delete transaction log' };
    }

    revalidatePath('/outflow');
    revalidatePath('/storage');
    // Try to revalidate customer page if possible, but we don't have the ID easily in path format without more work.
    // However, Dashboard/Customer list should be covered by revalidating queries if they use tags, but here we use paths.
    // Ideally we should revalidate `/customers/${record.customer_id}` but we need to ensure path is correct.
    if (record.customer_id) {
        revalidatePath(`/customers/${record.customer_id}`);
    }
    
    return { success: true, message: 'Outflow reverted successfully.' };
}

export async function updateOutflow(transactionId: string, formData: FormData) {
    const supabase = await createClient();
    
    // Parse Input
    const bags = parseInt(formData.get('bags') as string);
    const date = formData.get('date') as string;
    const rent = parseFloat(formData.get('rent') as string);

    if (isNaN(bags) || bags <= 0) return { success: false, message: 'Invalid bags quantity' };
    if (isNaN(rent) || rent < 0) return { success: false, message: 'Invalid rent amount' };
    
    // 1. Get Transaction & Record
    const { data: transaction, error: txError } = await supabase
        .from('withdrawal_transactions')
        .select('*, storage_record:storage_records(*)')
        .eq('id', transactionId)
        .single();
    
    if (txError || !transaction) return { success: false, message: 'Transaction not found' };
    
    const record = transaction.storage_record;
    if (!record) return { success: false, message: 'Storage record not found' };

    // 2. Calculate Differences (New - Old)
    // If difference is Positive, we are withdrawing MORE.
    // If difference is Negative, we are putting bags BACK.
    const bagsDiff = bags - transaction.bags_withdrawn;
    const rentDiff = rent - (transaction.rent_collected || 0);

    // Validate Stock Availability only if withdrawing MORE
    if (bagsDiff > 0 && record.bags_stored < bagsDiff) {
        return { success: false, message: `Cannot increase withdrawal by ${bagsDiff} bags. Only ${record.bags_stored} bags available.` };
    }

    // 3. Prepare Updates
    const currentBagsStored = record.bags_stored;
    const currentBagsOut = record.bags_out;
    const currentTotalRent = record.total_rent_billed;

    const recordUpdates: any = {
        bags_stored: currentBagsStored - bagsDiff,
        bags_out: (currentBagsOut || 0) + bagsDiff,
        total_rent_billed: Math.max(0, (currentTotalRent || 0) + rentDiff)
    };

    // Handle Status
    if (recordUpdates.bags_stored === 0) {
        // Closed
        recordUpdates.storage_end_date = new Date(date);
        recordUpdates.billing_cycle = 'Completed';
    } else {
        // Open
        if (record.storage_end_date) {
            recordUpdates.storage_end_date = null;
            recordUpdates.billing_cycle = 'Active';
        }
    }

    // 4. Apply Updates
    // A. Update Storage Record
    const { error: recError } = await supabase.from('storage_records').update(recordUpdates).eq('id', record.id);
    if (recError) return { success: false, message: 'Failed to update storage record' };

    // B. Update Lot Capacity - Handled by Trigger


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
}

/**
 * Server action to fetch customer records
 */
export async function getCustomerRecordsAction(customerId: string) {
    'use server';
    const { getStorageRecords } = await import('@/lib/queries');
    const allRecords = await getStorageRecords();
    return allRecords.filter(r => r.customerId === customerId);
}

/**
 * Server action to log user login activity
 */
export async function logLoginActivity() {
    'use server';
    try {
        const { logActivity } = await import('@/lib/logger');
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) return;
        
        await logActivity('LOGIN', 'User', user.id);
    } catch (error) {
        logError(error, { operation: 'log_login_activity' });
    }
}
