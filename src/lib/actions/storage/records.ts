'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import * as Sentry from "@sentry/nextjs";

import { createClient } from '@/utils/supabase/server';
import { getPaginatedStorageRecords, getStorageRecord, searchActiveStorageRecords, getUserWarehouse, getStorageRecords } from '@/lib/queries';
import { updateStorageRecord, deleteStorageRecord, restoreStorageRecord } from '@/lib/data';
import { detectStorageAnomalies as detectStorageAnomaliesFlow } from '@/ai/flows/anomaly-detection';
import { logError } from '@/lib/error-logger';
import { FormState } from '../common';
import type { StorageRecord } from '@/lib/definitions';

const { logger } = Sentry;

export async function findRecordsAction(query: string) {
    return await searchActiveStorageRecords(query);
}

export async function fetchStorageRecordsAction(
  page: number = 1, 
  limit: number = 20, 
  search?: string, 
  status: 'active' | 'all' | 'released' = 'active'
) {
    return await getPaginatedStorageRecords(page, limit, search, status);
}

export async function getStorageRecordAction(id: string) {
    return await getStorageRecord(id);
}

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

const StorageRecordUpdateSchema = z.object({
  customerId: z.string().min(1, 'Customer is required.'),
  commodityDescription: z.string().min(2, 'Commodity description is required.'),
  location: z.string().min(1, 'Location is required.'),
  bagsStored: z.coerce.number().int().positive('Bags must be a positive number.'),
  hamaliPayable: z.coerce.number().nonnegative('Hamali charges must be a non-negative number.'),
  storageStartDate: z.string().refine(val => !isNaN(Date.parse(val)), { message: "Invalid date format" }),
  cropId: z.string().optional(),
});

export async function updateStorageRecordAction(recordId: string, prevState: FormState, formData: FormData): Promise<FormState> {
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


export async function getCustomerRecordsAction(customerId: string) {
    const { getStorageRecords } = await import('@/lib/queries');
    const allRecords = await getStorageRecords();
    return allRecords.filter(r => r.customerId === customerId);
}
