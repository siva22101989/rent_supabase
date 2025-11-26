'use server';

import { z } from 'zod';
import { storageRecords, customers, RATE_6_MONTHS } from '@/lib/data';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { detectStorageAnomalies as detectStorageAnomaliesFlow } from '@/ai/flows/anomaly-detection';

const NewStorageSchema = z.object({
  customerId: z.string().min(1, 'Customer is required.'),
  commodityDescription: z.string().min(1, 'Commodity description is required.'),
  bagsStored: z.coerce.number().gt(0, 'Quantity must be greater than 0.'),
  storageStartDate: z.coerce.date(),
});

export type FormState = {
  message: string;
  success: boolean;
};

export async function addStorageRecord(prevState: FormState, formData: FormData) {
  const validatedFields = NewStorageSchema.safeParse({
    customerId: formData.get('customerId'),
    commodityDescription: formData.get('commodityDescription'),
    bagsStored: formData.get('bagsStored'),
    storageStartDate: formData.get('storageStartDate'),
  });

  if (!validatedFields.success) {
    return {
      message: validatedFields.error.flatten().fieldErrors.bagsStored?.[0] || 'Invalid data.',
      success: false,
    };
  }

  const { customerId, commodityDescription, bagsStored, storageStartDate } = validatedFields.data;
  
  const newRecord = {
    id: `rec_${Date.now()}`,
    customerId,
    commodityDescription,
    bagsStored,
    storageStartDate,
    storageEndDate: null,
    billingCycle: '6-Month Initial' as const,
    totalBilled: bagsStored * RATE_6_MONTHS,
  };

  storageRecords.unshift(newRecord);
  revalidatePath('/');
  redirect('/');
}

const WithdrawSchema = z.object({
    recordId: z.string().min(1, "Please select a storage record."),
    storageEndDate: z.coerce.date(),
});

export async function withdrawGoods(prevState: FormState, formData: FormData) {
    const validatedFields = WithdrawSchema.safeParse({
        recordId: formData.get('recordId'),
        storageEndDate: formData.get('storageEndDate'),
    });

    if (!validatedFields.success) {
        return {
            message: 'Invalid data submitted.',
            success: false,
        };
    }

    const { recordId, storageEndDate } = validatedFields.data;

    const recordIndex = storageRecords.findIndex(r => r.id === recordId);
    if (recordIndex === -1) {
        return { message: 'Record not found.', success: false };
    }

    storageRecords[recordIndex].storageEndDate = storageEndDate;
    storageRecords[recordIndex].billingCycle = 'Completed';

    revalidatePath('/');
    redirect('/');
}


export async function getAnomalyDetection() {
  try {
    const result = await detectStorageAnomaliesFlow({ storageRecords: JSON.stringify(storageRecords) });
    return { success: true, anomalies: result.anomalies };
  } catch (error) {
    return { success: false, anomalies: 'An error occurred while analyzing records.' };
  }
}
