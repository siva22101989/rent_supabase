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

export type CustomerWithBalance = Customer & {
  activeRecords: number;
  totalBilled: number;
  totalPaid: number;
  balance: number;
};

export type Commodity = {
  id: string;
  description: string;
};

// Database Enums
export type PaymentType = 'rent' | 'hamali' | 'advance' | 'security_deposit' | 'other';
export type BillingCycle = '6m' | '1y';
export type InflowType = 'purchase' | 'transfer_in' | 'return' | 'other';
export type LotStatus = 'active' | 'inactive' | 'maintenance' | 'full';

export type Payment = {
  amount: number;
  date: Date | string;
  type?: PaymentType; // Updated from literal union
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
  billingCycle: BillingCycle;
  payments: Payment[];
  hamaliPayable: number;
  totalRentBilled: number;
  lorryTractorNo: string;
  inflowType?: InflowType;
  plotBags?: number;
  loadBags?: number;
  khataAmount?: number;
  recordNumber?: string;
  outflowInvoiceNo?: string;
  customerName?: string;
  notes?: string;
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
