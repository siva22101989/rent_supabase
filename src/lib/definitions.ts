import type { Timestamp } from 'firebase/firestore';

export type Customer = {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  fatherName: string;
  village: string;
};

export type Commodity = {
  id: string;
  description: string;
};

export type Payment = {
  amount: number;
  date: Date | Timestamp;
};

export type StorageRecord = {
  id: string;
  customerId: string;
  commodityDescription: string;
  location: string;
  bagsStored: number;
  storageStartDate: Date | Timestamp;
  storageEndDate: Date | Timestamp | null;
  billingCycle: '6-Month Initial' | '1-Year Rollover' | '1-Year Renewal' | 'Completed';
  payments: Payment[];
  hamaliPayable: number;
  totalRentBilled: number;
  lorryTractorNo: string;
  weight: number;
};
