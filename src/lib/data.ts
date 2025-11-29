
'use server';

import fs from 'fs/promises';
import path from 'path';
import type { Customer, StorageRecord, Payment, Expense } from '@/lib/definitions';
import { revalidatePath } from 'next/cache';

const customersPath = path.join(process.cwd(), 'src/lib/data/customers.json');
const storageRecordsPath = path.join(process.cwd(), 'src/lib/data/storageRecords.json');
const expensesPath = path.join(process.cwd(), 'src/lib/data/expenses.json');

// Helper to read and parse JSON file
async function readJsonFile<T>(filePath: string): Promise<T> {
  try {
    const fileContent = await fs.readFile(filePath, 'utf8');
    return JSON.parse(fileContent) as T;
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      // File doesn't exist, return empty array for lists
      return [] as T;
    }
    throw error;
  }
}

// Helper to write to JSON file
async function writeJsonFile<T>(filePath: string, data: T): Promise<void> {
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
}


// Customer Functions
export async function customers(): Promise<Customer[]> {
  return await readJsonFile<Customer[]>(customersPath);
}

export const getCustomer = async (id: string): Promise<Customer | null> => {
  const allCustomers = await customers();
  return allCustomers.find(c => c.id === id) || null;
};

export const saveCustomer = async (customer: Customer): Promise<void> => {
  const allCustomers = await customers();
  allCustomers.push(customer);
  await writeJsonFile(customersPath, allCustomers);
};

// Storage Record Functions
export async function storageRecords(): Promise<StorageRecord[]> {
  const records = await readJsonFile<StorageRecord[]>(storageRecordsPath);
  // Dates are stored as ISO strings, so we need to convert them to Date objects
  return records.map(record => ({
    ...record,
    storageStartDate: new Date(record.storageStartDate),
    storageEndDate: record.storageEndDate ? new Date(record.storageEndDate) : null,
    payments: (record.payments || []).map(p => ({...p, date: new Date(p.date)}))
  }));
}

export const getStorageRecord = async (id: string): Promise<StorageRecord | null> => {
  const allRecords = await storageRecords();
  return allRecords.find(r => r.id === id) || null;
};

export const saveStorageRecord = async (record: StorageRecord): Promise<void> => {
  const allRecords = await storageRecords();
  allRecords.push(record);
  await writeJsonFile(storageRecordsPath, allRecords);
};

export const updateStorageRecord = async (id: string, data: Partial<StorageRecord>): Promise<void> => {
    const allRecords = await storageRecords();
    const recordIndex = allRecords.findIndex(r => r.id === id);
    if (recordIndex === -1) {
        throw new Error("Record not found");
    }
    allRecords[recordIndex] = { ...allRecords[recordIndex], ...data };
    await writeJsonFile(storageRecordsPath, allRecords);
}

export const deleteStorageRecord = async (id: string): Promise<void> => {
    const allRecords = await storageRecords();
    const updatedRecords = allRecords.filter(r => r.id !== id);
    if (allRecords.length === updatedRecords.length) {
        throw new Error("Record not found to delete");
    }
    await writeJsonFile(storageRecordsPath, updatedRecords);
};

export const addPaymentToRecord = async (recordId: string, payment: Payment) => {
    const allRecords = await storageRecords();
    const recordIndex = allRecords.findIndex(r => r.id === recordId);
    if (recordIndex === -1) {
        throw new Error("Record not found");
    }
    const record = allRecords[recordIndex];
    const updatedPayments = record.payments ? [...record.payments, payment] : [payment];
    allRecords[recordIndex] = { ...record, payments: updatedPayments };
    await writeJsonFile(storageRecordsPath, allRecords);
}

// Expense Functions
export async function expenses(): Promise<Expense[]> {
  const allExpenses = await readJsonFile<Expense[]>(expensesPath);
  return allExpenses.map(expense => ({
    ...expense,
    date: new Date(expense.date),
  }));
}

export async function saveExpense(expense: Expense): Promise<void> {
  const allExpenses = await expenses();
  allExpenses.push(expense);
  await writeJsonFile(expensesPath, allExpenses);
}

export const updateExpense = async (id: string, data: Partial<Expense>): Promise<void> => {
    const allExpenses = await expenses();
    const expenseIndex = allExpenses.findIndex(e => e.id === id);
    if (expenseIndex === -1) {
        throw new Error("Expense not found");
    }
    allExpenses[expenseIndex] = { ...allExpenses[expenseIndex], ...data };
    await writeJsonFile(expensesPath, allExpenses);
};

export const deleteExpense = async (id: string): Promise<void> => {
    const allExpenses = await expenses();
    const updatedExpenses = allExpenses.filter(e => e.id !== id);
    if (allExpenses.length === updatedExpenses.length) {
        throw new Error("Expense not found to delete");
    }
    await writeJsonFile(expensesPath, updatedExpenses);
};


// These functions were for Firebase and are now replaced by local JSON file logic
export const saveCustomers = async (data: Customer[]): Promise<void> => {
  await writeJsonFile(customersPath, data);
};

export const saveStorageRecords = async (data: StorageRecord[]): Promise<void> => {
  await writeJsonFile(storageRecordsPath, data);
};
