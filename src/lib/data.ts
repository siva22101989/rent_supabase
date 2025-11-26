
import type { Customer, StorageRecord, Product } from '@/lib/definitions';
import fs from 'fs/promises';
import path from 'path';

// Rates
export const RATE_6_MONTHS = 36;
export const RATE_1_YEAR = 55;

// Data file paths
const dataDir = path.join(process.cwd(), 'src', 'lib', 'data');
const customersPath = path.join(dataDir, 'customers.json');
const storageRecordsPath = path.join(dataDir, 'storageRecords.json');
const productsPath = path.join(dataDir, 'products.json');

// Helper function to read JSON file
async function readJsonFile<T>(filePath: string): Promise<T[]> {
  try {
    const fileContent = await fs.readFile(filePath, 'utf-8');
    const data = JSON.parse(fileContent);
    // Date strings need to be converted back to Date objects
    if (filePath === storageRecordsPath) {
        return (data as any[]).map(record => ({
            ...record,
            storageStartDate: new Date(record.storageStartDate),
            storageEndDate: record.storageEndDate ? new Date(record.storageEndDate) : null,
        })) as T[];
    }
    return data as T[];
  } catch (error) {
    // If file doesn't exist or is empty, return an empty array
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return [];
    }
    console.error(`Error reading file ${filePath}:`, error);
    return [];
  }
}

// Helper function to write JSON file
async function writeJsonFile<T>(filePath: string, data: T[]): Promise<void> {
  try {
    await fs.mkdir(dataDir, { recursive: true });
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (error) {
    console.error(`Error writing file ${filePath}:`, error);
  }
}

// Data access functions
export const customers = async (): Promise<Customer[]> => readJsonFile<Customer>(customersPath);
export const storageRecords = async (): Promise<StorageRecord[]> => readJsonFile<StorageRecord>(storageRecordsPath);
export const products = async (): Promise<Product[]> => readJsonFile<Product>(productsPath);

// Data mutation functions
export const saveCustomers = async (data: Customer[]): Promise<void> => writeJsonFile(customersPath, data);
export const saveStorageRecords = async (data: StorageRecord[]): Promise<void> => writeJsonFile(storageRecordsPath, data);
export const saveProducts = async (data: Product[]): Promise<void> => writeJsonFile(productsPath, data);
