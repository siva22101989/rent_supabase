
'use server';

import { z } from 'zod';
import { storageRecords, customers, saveCustomers, saveStorageRecords } from '@/lib/data';
import { redirect } from 'next/navigation';
import { revalidatePath, revalidateTag } from 'next/cache';
import { detectStorageAnomalies as detectStorageAnomaliesFlow } from '@/ai/flows/anomaly-detection';
import { calculateFinalRent, RATE_6_MONTHS } from '@/lib/billing';

const NewCustomerSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters.'),
  phone: z.string().min(10, 'Phone number must be at least 10 digits.'),
  address: z.string().min(5, 'Address must be at least 5 characters.'),
  email: z.string().optional(),
});

export type FormState = {
  message: string;
  success: boolean;
};

export async function getAnomalyDetection() {
  try {
    const records = await storageRecords();
    const result = await detectStorageAnomaliesFlow({ storageRecords: JSON.stringify(records) });
    return { success: true, anomalies: result.anomalies };
  } catch (error) {
    return { success: false, anomalies: 'An error occurred while analyzing records.' };
  }
}

export async function addCustomer(prevState: FormState, formData: FormData) {
    const validatedFields = NewCustomerSchema.safeParse({
        name: formData.get('name'),
        email: formData.get('email'),
        phone: formData.get('phone'),
        address: formData.get('address'),
    });

    if (!validatedFields.success) {
        const error = validatedFields.error.flatten().fieldErrors;
        const message = Object.values(error).flat().join(', ');
        return { message: `Invalid data: ${message}`, success: false };
    }

    const newCustomer = {
        id: `cust_${Date.now()}`,
        ...validatedFields.data,
        email: validatedFields.data.email ?? '',
    };

    const currentCustomers = await customers();
    currentCustomers.unshift(newCustomer);
    await saveCustomers(currentCustomers);
    
    revalidateTag('customers');
    redirect('/customers');
}

const InflowSchema = z.object({
    customerId: z.string().min(1, 'Customer is required.'),
    commodityDescription: z.string().min(2, 'Commodity description is required.'),
    bagsStored: z.coerce.number().int().positive('Number of bags must be a positive number.'),
    hamaliRate: z.coerce.number().positive('Hamali rate must be a positive number.'),
});

export type InflowFormState = {
    message: string;
    success: boolean;
};

export async function addInflow(prevState: InflowFormState, formData: FormData) {
    const validatedFields = InflowSchema.safeParse({
        customerId: formData.get('customerId'),
        commodityDescription: formData.get('commodityDescription'),
        bagsStored: formData.get('bagsStored'),
        hamaliRate: formData.get('hamaliRate'),
    });

    if (!validatedFields.success) {
        const error = validatedFields.error.flatten().fieldErrors;
        const message = Object.values(error).flat().join(', ');
        return { message: `Invalid data: ${message}`, success: false };
    }

    const { bagsStored, hamaliRate, ...rest } = validatedFields.data;

    const hamaliCharges = bagsStored * hamaliRate;
    const initialRent = bagsStored * RATE_6_MONTHS;
    
    const newRecord = {
        id: `rec_${Date.now()}`,
        ...rest,
        bagsStored,
        storageStartDate: new Date().toISOString(),
        storageEndDate: null,
        billingCycle: '6-Month Initial' as const,
        totalBilled: hamaliCharges + initialRent,
        hamaliCharges,
    };

    const currentRecords = await storageRecords();
    currentRecords.unshift(newRecord);
    await saveStorageRecords(currentRecords);

    revalidateTag('storageRecords');
    redirect('/');
}

const OutflowSchema = z.object({
  recordId: z.string().min(1, 'Please select a record to withdraw.'),
  bagsToWithdraw: z.coerce.number().int().positive('Bags to withdraw must be a positive number.'),
});

export type OutflowFormState = {
  message: string;
  success: boolean;
};

export async function addOutflow(prevState: OutflowFormState, formData: FormData) {
    const validatedFields = OutflowSchema.safeParse({
        recordId: formData.get('recordId'),
        bagsToWithdraw: formData.get('bagsToWithdraw'),
    });

    if (!validatedFields.success) {
        return { message: 'Invalid data submitted.', success: false };
    }
    
    const currentRecords = await storageRecords();
    const { recordId, bagsToWithdraw } = validatedFields.data;
    const recordIndex = currentRecords.findIndex(r => r.id === recordId);

    if (recordIndex === -1) {
        return { message: 'Record not found.', success: false };
    }

    const record = currentRecords[recordIndex];
    
    if(bagsToWithdraw > record.bagsStored) {
        return { message: 'Cannot withdraw more bags than are stored.', success: false };
    }
    
    const withdrawalDate = new Date();
    const { rent: additionalRent } = calculateFinalRent(record, withdrawalDate, bagsToWithdraw);

    const isPartialWithdrawal = bagsToWithdraw < record.bagsStored;

    if (isPartialWithdrawal) {
        // Create a new record for the remaining bags
        const remainingBags = record.bagsStored - bagsToWithdraw;
        const hamaliPerBag = record.hamaliCharges / record.bagsStored;
        const rentPerBag = (record.totalBilled - record.hamaliCharges) / record.bagsStored;

        const newRecordForRemaining = {
            ...record,
            id: `rec_${Date.now()}`,
            bagsStored: remainingBags,
            hamaliCharges: remainingBags * hamaliPerBag,
            totalBilled: (remainingBags * rentPerBag) + (remainingBags * hamaliPerBag),
        };
        
        currentRecords.push(newRecordForRemaining);

        // Update the original record to reflect the partial withdrawal
        const updatedRecord = {
            ...record,
            bagsStored: bagsToWithdraw,
            storageEndDate: withdrawalDate.toISOString(),
            totalBilled: (record.totalBilled / record.bagsStored) * bagsToWithdraw + additionalRent,
            billingCycle: 'Completed' as const,
        };
        currentRecords[recordIndex] = updatedRecord;

    } else {
        // Full withdrawal
        const updatedRecord = {
            ...record,
            storageEndDate: withdrawalDate.toISOString(),
            totalBilled: record.totalBilled + additionalRent,
            billingCycle: 'Completed' as const,
        };
        currentRecords[recordIndex] = updatedRecord;
    }

    await saveStorageRecords(currentRecords);
    
    revalidateTag('storageRecords');
    redirect('/billing');
}

const BillingRecordSchema = z.object({
  recordId: z.string(),
  totalBilled: z.coerce.number().positive('Total billed amount must be a positive number.'),
  storageEndDate: z.string().refine(val => !isNaN(Date.parse(val)), { message: "Invalid date format" }),
});

export type BillingFormState = {
    message: string;
    success: boolean;
};

export async function updateBillingRecord(prevState: BillingFormState, formData: FormData) {
    const validatedFields = BillingRecordSchema.safeParse({
        recordId: formData.get('recordId'),
        totalBilled: formData.get('totalBilled'),
        storageEndDate: formData.get('storageEndDate'),
    });

    if (!validatedFields.success) {
        const error = validatedFields.error.flatten().fieldErrors;
        const message = Object.values(error).flat().join(', ');
        return { message: `Invalid data: ${message}`, success: false };
    }

    const currentRecords = await storageRecords();
    const { recordId, totalBilled, storageEndDate } = validatedFields.data;
    
    const recordIndex = currentRecords.findIndex(r => r.id === recordId);

    if (recordIndex === -1) {
        return { message: 'Record not found.', success: false };
    }

    currentRecords[recordIndex] = {
        ...currentRecords[recordIndex],
        totalBilled,
        storageEndDate: new Date(storageEndDate),
    };

    await saveStorageRecords(currentRecords);

    revalidateTag('storageRecords');
    return { message: 'Record updated successfully.', success: true };
}


export async function deleteBillingRecord(formData: FormData) {
    const recordId = formData.get('recordId') as string;
    if (!recordId) {
        // This should not happen if the form is set up correctly
        return;
    }

    let currentRecords = await storageRecords();
    currentRecords = currentRecords.filter(r => r.id !== recordId);
    await saveStorageRecords(currentRecords);

    revalidateTag('storageRecords');
    // No redirect needed, just revalidation will refresh the page data
}


const StorageRecordSchema = z.object({
  customerId: z.string().min(1, 'Customer is required.'),
  commodityDescription: z.string().min(2, 'Commodity description is required.'),
  bagsStored: z.coerce.number().int().positive('Bags must be a positive number.'),
  hamaliCharges: z.coerce.number().nonnegative('Hamali charges must be a non-negative number.'),
  totalBilled: z.coerce.number().nonnegative('Total billed must be a non-negative number.'),
  storageStartDate: z.string().refine(val => !isNaN(Date.parse(val)), { message: "Invalid date format" }),
});


export async function updateStorageRecord(recordId: string, prevState: InflowFormState, formData: FormData) {
    const validatedFields = StorageRecordSchema.safeParse({
        customerId: formData.get('customerId'),
        commodityDescription: formData.get('commodityDescription'),
        bagsStored: formData.get('bagsStored'),
        hamaliCharges: formData.get('hamaliCharges'),
        totalBilled: formData.get('totalBilled'),
        storageStartDate: formData.get('storageStartDate'),
    });

    if (!validatedFields.success) {
        const error = validatedFields.error.flatten().fieldErrors;
        const message = Object.values(error).flat().join(', ');
        return { message: `Invalid data: ${message}`, success: false };
    }

    const currentRecords = await storageRecords();
    const recordIndex = currentRecords.findIndex(r => r.id === recordId);

    if (recordIndex === -1) {
        return { message: 'Record not found.', success: false };
    }

    const originalRecord = currentRecords[recordIndex];

    currentRecords[recordIndex] = {
        ...originalRecord,
        ...validatedFields.data,
        storageStartDate: new Date(validatedFields.data.storageStartDate),
    };

    await saveStorageRecords(currentRecords);

    revalidateTag('storageRecords');
    return { message: 'Record updated successfully.', success: true };
}
