'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import * as Sentry from "@sentry/nextjs";

import { createClient } from '@/utils/supabase/server';
import { getCustomers, getUserWarehouse } from '@/lib/queries';
import { saveCustomer } from '@/lib/data';
import { logError, logWarning } from '@/lib/error-logger';
import { checkRateLimit } from '@/lib/rate-limit';
import { FormState } from './common';
import { CommonSchemas } from '../validation';



const CustomerSchema = z.object({
    name: z.string().min(3, 'Name must be at least 3 characters.'),
    phone: CommonSchemas.phone, // Uses international format validation with auto-format
    address: z.string().min(5, 'Address must be at least 5 characters.'),
    email: z.string().optional(),
    fatherName: z.string().optional(),
    village: z.string().optional(),
});

export async function fetchCustomers() {
    return await getCustomers();
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

            const validatedFields = CustomerSchema.safeParse(rawData);

            if (!validatedFields.success) {
                const error = validatedFields.error.flatten().fieldErrors;
                const message = Object.values(error).flat().join(', ');
                logWarning("Customer validation failed", { operation: 'addCustomer', metadata: { errors: error } });
                return { message: `Invalid data: ${message}`, success: false, data: rawData };
            }

            const { email, fatherName, village, ...rest } = validatedFields.data;

            // Auto-Link Logic (Portal Compatible)
            let linkedUserId = undefined;
            if (rest.phone && /^\d{10}$/.test(rest.phone)) {
                 try {
                     const { createAdminClient } = await import('@/utils/supabase/admin');
                     const supabaseAdmin = createAdminClient();
                     const searchPhone = `+91${rest.phone}`;
                     
                     // Search for existing Phone Auth User
                     // We can't efficiently filter listUsers by phone in all versions, 
                     // but we can try getUserById if we had it, or just list and find.
                     // Since this is an admin action, listing is acceptable for now.
                     // Optimization: Use listUsers({ page: 1, perPage: 100 }) might miss it if DB huge.
                     // Better: We can rely on the trigger for *future* users.
                     // But for *existing* users who haven't been linked, we need to find them.
                     
                     // Actually, Supabase Admin API allows strict phone search? Not easily.
                     // Let's iterate.
                     const { data: { users } } = await supabaseAdmin.auth.admin.listUsers();
                     const existingUser = users.find(u => u.phone === searchPhone);

                     if (existingUser) {
                         linkedUserId = existingUser.id;
                         Sentry.addBreadcrumb({
                             category: 'auth',
                             message: 'Linked to existing phone user',
                             data: { userId: linkedUserId },
                             level: 'info'
                         });
                     }
                     // NOTE: We do NOT create dummy users anymore. 
                     // We wait for the real user to sign up via Portal.
                     // When they sign up, the Trigger will link them (if this Customer exists).
                 } catch (e) {
                     logError(e, { operation: 'addCustomer_autoLink', metadata: { phone: rest.phone } });
                 }
            }

            const newCustomer = {
                ...rest,
                id: crypto.randomUUID(),
                email: email ?? '',
                fatherName: fatherName ?? '',
                village: village ?? '',
                linkedUserId: linkedUserId
            };
            
            try {
                await saveCustomer(newCustomer);
                revalidatePath('/customers');
                revalidatePath('/inflow');
                Sentry.addBreadcrumb({
                    category: 'customer',
                    message: 'Customer added successfully',
                    data: { customerId: newCustomer.id },
                    level: 'info'
                });
                return { message: 'Customer added successfully.', success: true };
            } catch (error: any) {
                logError(error, { operation: 'addCustomer', metadata: { customerId: newCustomer.id } });
                return { message: `Failed to add customer: ${error.message}`, success: false, data: rawData };
            }
        }
    );
}

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
            revalidatePath('/storage');
            revalidatePath('/financials');
            revalidatePath('/inflow'); // Name changes affect search/filters
            return { message: 'Customer updated successfully!', success: true };
        }
    );
}

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

            // Check if customer has any active storage records (ignore deleted ones)
            const { data: records, error: checkError } = await supabase
                .from('storage_records')
                .select('id')
                .eq('customer_id', customerId)
                .is('deleted_at', null)
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

            // Soft Delete customer instead of Hard Delete
            const { error } = await supabase
                .from('customers')
                .update({ deleted_at: new Date().toISOString() })
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

export async function restoreCustomer(customerId: string): Promise<FormState> {
    return Sentry.startSpan(
        {
            op: "function",
            name: "restoreCustomer",
        },
        async (span) => {
            await checkRateLimit(customerId || 'anon', 'restoreCustomer', { limit: 5 });
            span.setAttribute("customerId", customerId);

            const supabase = await createClient();
            const warehouseId = await getUserWarehouse();

            if (!warehouseId) {
                return { message: 'No warehouse found.', success: false };
            }

            const { error } = await supabase
                .from('customers')
                .update({ deleted_at: null })
                .eq('id', customerId)
                .eq('warehouse_id', warehouseId);

            if (error) {
                logError(error, { operation: 'restore_customer', warehouseId, metadata: { customerId } });
                return { message: 'Failed to restore customer', success: false };
            }

            revalidatePath('/customers');
            return { message: 'Customer restored successfully!', success: true };
        }
    );
}
