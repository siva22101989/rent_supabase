
export type Customer = {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
};

export type Product = {
  id: string;
  name: string;
};

export type Commodity = {
  id: string;
  description: string;
};

// Dates are stored as ISO strings in JSON, but will be converted to Date objects when read.
export type StorageRecord = {
  id: string;
  customerId: string;
  commodityDescription: string;
  bagsStored: number;
  storageStartDate: Date;
  storageEndDate: Date | null;
  billingCycle: '6-Month Initial' | '1-Year Rollover' | '1-Year Renewal' | 'Completed';
  totalBilled: number;
  hamaliCharges: number;
};
