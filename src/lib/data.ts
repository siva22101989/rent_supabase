import type { Customer, StorageRecord } from '@/lib/definitions';

// Rates
export const RATE_6_MONTHS = 36;
export const RATE_1_YEAR = 55;

// Mock Data
export const customers: Customer[] = [
  { id: 'cust_1', name: 'Global Agri Co.', email: 'contact@globalagri.com', phone: '9876543210', address: '123 Agri Street, Farmville' },
  { id: 'cust_2', name: 'Grain Traders Inc.', email: 'trading@graininc.com', phone: '8765432109', address: '456 Market Road, Tradeton' },
  { id: 'cust_3', name: 'Farm Supplies Ltd.', email: 'supplies@farm.co', phone: '7654321098', address: '789 Supply Lane, Harvestburg' },
];

export const storageRecords: StorageRecord[] = [
  {
    id: 'rec_1',
    customerId: 'cust_1',
    commodityDescription: 'Paddy, Grade A',
    bagsStored: 150,
    storageStartDate: new Date('2023-11-15'),
    storageEndDate: null,
    billingCycle: '1-Year Rollover',
    totalBilled: 150 * 55,
    hamaliCharges: 2.5 * 150,
  },
  {
    id: 'rec_2',
    customerId: 'cust_2',
    commodityDescription: 'Bengalgram, Bulk',
    bagsStored: 500,
    storageStartDate: new Date(),
    storageEndDate: null,
    billingCycle: '6-Month Initial',
    totalBilled: 500 * 36,
    hamaliCharges: 2.5 * 500,
  },
    {
    id: 'rec_4',
    customerId: 'cust_3',
    commodityDescription: 'Soyabeans',
    bagsStored: 300,
    storageStartDate: new Date(new Date().setMonth(new Date().getMonth() - 7)),
    storageEndDate: null,
    billingCycle: '6-Month Initial',
    totalBilled: 300 * 36,
    hamaliCharges: 2.5 * 300,
  },
  {
    id: 'rec_3',
    customerId: 'cust_1',
    commodityDescription: 'Wheat, Type 1',
    bagsStored: 200,
    storageStartDate: new Date('2022-05-20'),
    storageEndDate: new Date('2023-05-19'),
    billingCycle: 'Completed',
    totalBilled: 200 * 55,
    hamaliCharges: 2.5 * 200,
  },
];
