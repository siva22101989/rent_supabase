export type Customer = {
  id: string;
  name: string;
  email?: string;
  phone: string;
  address: string;
  fatherName: string;
  village: string;
  updatedAt?: Date | string;
  linkedUserId?: string;
};

export type Commodity = {
  id: string;
  description: string;
};

export type Payment = {
  amount: number;
  date: Date | string;
  type?: 'rent' | 'hamali' | 'other';
  notes?: string;
  paymentNumber?: number;
  updatedAt?: Date | string;
};

export type StorageRecord = {
  id: string;
  customerId: string;
  cropId?: string;
  commodityDescription: string;
  lotId?: string;
  location: string;
  bagsIn: number;
  bagsOut: number;
  bagsStored: number;
  storageStartDate: Date | string;
  storageEndDate: Date | string | null;
  billingCycle: '6-Month Initial' | '1-Year Rollover' | '1-Year Renewal' | 'Completed';
  payments: Payment[];
  hamaliPayable: number;
  totalRentBilled: number;
  lorryTractorNo: string;
  inflowType?: 'Direct' | 'Plot';
  plotBags?: number;
  loadBags?: number;
  khataAmount?: number;
  recordNumber?: string;
  outflowInvoiceNo?: string;
  customerName?: string;
  updatedAt?: Date | string;
};

export const expenseCategories = ["Worker Salary", "Petrol", "Maintenance", "Utilities", "Hamali", "Other"] as const;

export type ExpenseCategory = typeof expenseCategories[number];

export type Expense = {
  id: string;
  description: string;
  amount: number;
  category: ExpenseCategory;
  date: Date | string;
  updatedAt?: Date | string;
};

export type TeamMember = {
  id: string;
  email: string;
  fullName: string;
  role: 'super_admin' | 'owner' | 'admin' | 'manager' | 'staff' | 'suspended' | 'customer';
  createdAt: Date | string;
  lastSignInAt?: Date | string;
};

export type Warehouse = {
    id: string;
    name: string;
    location: string;
    capacity_bags: number;
    created_at: Date | string;
};

export type UserWarehouse = {
    id: string;
    userId: string;
    warehouseId: string;
    role: string;
    warehouse?: Warehouse;
};

export const roleHierarchy: Record<string, number> = {
    'super_admin': 100,
    'owner': 90,
    'admin': 80,
    'manager': 50,
    'staff': 10,
    'suspended': 0,
    'customer': 0
};
