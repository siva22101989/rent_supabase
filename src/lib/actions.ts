'use server';

import { z } from 'zod';
import { storageRecords, customers } from '@/lib/data';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { detectStorageAnomalies as detectStorageAnomaliesFlow } from '@/ai/flows/anomaly-detection';
import { calculateFinalRent } from './billing';

const NewStorageSchema = z.object({
  customerId: z.string().min(1, 'Customer is required.'),
  commodityDescription: z.string().min(1, 'Commodity description is required.'),
  bagsStored: z.coerce.number().gt(0, 'Quantity must be greater than 0.'),
  storageStartDate: z.coerce.date(),
  hamaliRate: z.coerce.number().min(0, 'Hamali rate must be a positive number.'),
});

const NewCustomerSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters.'),
  email: z.string().email('Invalid email address.'),
  phone: z.string().min(10, 'Phone number must be at least 10 digits.'),
  address: z.string().min(5, 'Address must be at least 5 characters.'),
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
    hamaliRate: formData.get('hamaliRate'),
  });

  if (!validatedFields.success) {
    let errorMessage = 'Invalid data.';
    const fieldErrors = validatedFields.error.flatten().fieldErrors;
    if (fieldErrors.bagsStored) {
      errorMessage = fieldErrors.bagsStored[0];
    } else if (fieldErrors.hamaliRate) {
        errorMessage = fieldErrors.hamaliRate[0];
    }
    return {
      message: errorMessage,
      success: false,
    };
  }

  const { customerId, commodityDescription, bagsStored, storageStartDate, hamaliRate } = validatedFields.data;
  
  const hamaliCharges = bagsStored * hamaliRate;

  const newRecord = {
    id: `rec_${Date.now()}`,
    customerId,
    commodityDescription,
    bagsStored,
    storageStartDate,
    storageEndDate: null,
    billingCycle: '6-Month Initial' as const,
    hamaliCharges,
    totalBilled: hamaliCharges, // Hamali charges are part of the initial bill
  };

  storageRecords.unshift(newRecord);
  revalidatePath('/');
  revalidatePath('/billing');
  redirect('/');
}

const WithdrawSchema = z.object({
    recordId: z.string().min(1, "Please select a storage record."),
    storageEndDate: z.coerce.date(),
    bagsToWithdraw: z.coerce.number().gt(0, "Number of bags must be positive."),
});

export async function withdrawGoods(prevState: FormState, formData: FormData) {
    const validatedFields = WithdrawSchema.safeParse({
        recordId: formData.get('recordId'),
        storageEndDate: formData.get('storageEndDate'),
        bagsToWithdraw: formData.get('bagsToWithdraw'),
    });

    if (!validatedFields.success) {
        return {
            message: 'Invalid data submitted.',
            success: false,
        };
    }

    const { recordId, storageEndDate, bagsToWithdraw } = validatedFields.data;

    const recordIndex = storageRecords.findIndex(r => r.id === recordId);
    if (recordIndex === -1) {
        return { message: 'Record not found.', success: false };
    }

    const record = storageRecords[recordIndex];

    if (bagsToWithdraw > record.bagsStored) {
        return { message: 'Cannot withdraw more bags than are in storage.', success: false };
    }

    const { rent } = calculateFinalRent(record, storageEndDate);
    
    // For now, we assume full withdrawal. Partial withdrawal logic would be more complex.
    // We will mark the record as complete regardless of partial or full withdrawal for simplicity.
    // A more advanced implementation would create a new record for the remaining bags.

    storageRecords[recordIndex].storageEndDate = storageEndDate;
    storageRecords[recordIndex].billingCycle = 'Completed';
    storageRecords[recordIndex].totalBilled += rent;
    // We are not reducing the bagsStored for simplicity as the record is marked completed.

    revalidatePath('/');
    revalidatePath('/withdraw');
    revalidatePath('/billing');
    redirect('/billing');
}


export async function getAnomalyDetection() {
  try {
    const result = await detectStorageAnomaliesFlow({ storageRecords: JSON.stringify(storageRecords) });
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
    };

    customers.unshift(newCustomer);
    
    revalidatePath('/customers');
    revalidatePath('/new-storage');
    revalidatePath('/withdraw');

    // Redirecting is a more reliable way to ensure the UI updates across pages.
    redirect('/customers');
}
