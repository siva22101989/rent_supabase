
'use server';

import { z } from 'zod';
import { storageRecords, customers, products, RATE_6_MONTHS, RATE_1_YEAR } from '@/lib/data';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { detectStorageAnomalies as detectStorageAnomaliesFlow } from '@/ai/flows/anomaly-detection';
import { calculateFinalRent } from '@/lib/billing';

const NewCustomerSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters.'),
  email: z.string().optional(),
  phone: z.string().min(10, 'Phone number must be at least 10 digits.'),
  address: z.string().min(5, 'Address must be at least 5 characters.'),
});

export type FormState = {
  message: string;
  success: boolean;
};

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
        email: validatedFields.data.email ?? '',
    };

    customers.unshift(newCustomer);
    
    revalidatePath('/customers');
    revalidatePath('/inflow');
    revalidatePath('/outflow');
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
        storageStartDate: new Date(),
        storageEndDate: null,
        billingCycle: '6-Month Initial' as const,
        totalBilled: hamaliCharges + initialRent,
        hamaliCharges,
    };

    storageRecords.unshift(newRecord);

    revalidatePath('/');
    revalidatePath('/billing');
    revalidatePath('/inflow');
    redirect('/');
}

const OutflowSchema = z.object({
  recordId: z.string().min(1, 'Please select a record to withdraw.'),
});

export type OutflowFormState = {
  message: string;
  success: boolean;
};

export async function addOutflow(prevState: OutflowFormState, formData: FormData) {
    const validatedFields = OutflowSchema.safeParse({
        recordId: formData.get('recordId'),
    });

    if (!validatedFields.success) {
        return { message: 'Invalid data submitted.', success: false };
    }

    const { recordId } = validatedFields.data;
    const recordIndex = storageRecords.findIndex(r => r.id === recordId);

    if (recordIndex === -1) {
        return { message: 'Record not found.', success: false };
    }

    const record = storageRecords[recordIndex];
    const withdrawalDate = new Date();

    const { rent: additionalRent } = calculateFinalRent(record, withdrawalDate);

    const updatedRecord = {
        ...record,
        storageEndDate: withdrawalDate,
        totalBilled: record.totalBilled + additionalRent,
        billingCycle: 'Completed' as const,
    };
    
    storageRecords[recordIndex] = updatedRecord;

    revalidatePath('/');
    revalidatePath('/billing');
    revalidatePath('/outflow');
    redirect('/billing');
}

const NewProductSchema = z.object({
  name: z.string().min(3, 'Product name must be at least 3 characters.'),
});

export type ProductFormState = {
  message: string;
  success: boolean;
};


export async function addProduct(prevState: ProductFormState, formData: FormData) {
    const validatedFields = NewProductSchema.safeParse({
        name: formData.get('name'),
    });

    if (!validatedFields.success) {
        const error = validatedFields.error.flatten().fieldErrors;
        const message = Object.values(error).flat().join(', ');
        return { message: `Invalid data: ${message}`, success: false };
    }

    const newProduct = {
        id: `prod_${Date.now()}`,
        ...validatedFields.data,
    };

    products.unshift(newProduct);
    
    revalidatePath('/products');

    return { message: 'Product added successfully.', success: true };
}
