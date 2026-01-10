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
  deletedAt?: Date | string | null;
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
  deletedAt?: Date | string | null;
};

export type Warehouse = {
    id: string;
    name: string;
    location: string;
    capacity_bags: number;
    gst_number?: string;
    created_at: Date | string;
    deleted_at?: Date | string | null;
};

export type UserWarehouse = {
    id: string;
    userId: string;
    warehouseId: string;
    role: string;
    warehouse?: Warehouse;
};

export interface WarehouseWithRole {
    id: string;
    role: string;
    name: string;
    location: string;
    gst_number?: string;
}

export const roleHierarchy: Record<string, number> = {
    'super_admin': 100,
    'owner': 90,
    'admin': 80,
    'manager': 50,
    'staff': 10,
    'suspended': 0,
    'customer': 0
};

// --- Analytics & Admin Types ---

export interface NotificationEntry {
    id: string;
    warehouse_id: string;
    user_id: string | null;
    title: string;
    message: string;
    type: 'info' | 'warning' | 'error' | 'success';
    read: boolean;
    link?: string;
    created_at: Date | string;
}

export interface AdminDashboardStats {
    warehouseCount: number;
    usersCount: number;
    customersCount: number;
    activeRecordsCount: number;
    totalStock: number;
}

export interface WarehouseAdminDetails extends Warehouse {
    totalStock: number;
    totalCapacity: number;
    occupancyRate: number;
    activeRecords: number;
    warehouse_lots?: { current_stock: number; capacity: number }[];
    storage_records?: { id: string; bags_stored: number }[];
}

export interface ActivityLogEntry {
    id: string;
    warehouse_id: string;
    user_id: string;
    action: string;
    entity: string;
    entity_id: string;
    details: any;
    ip_address?: string;
    created_at: Date | string;
    user?: { full_name: string; email: string };
    warehouse?: { name: string };
}

export interface AnalyticsGrowthData {
    month: string;
    warehouses: number;
    users: number;
}

export interface CommodityDistribution {
    name: string;
    value: number;
}

export interface PlatformAnalytics {
    growthData: AnalyticsGrowthData[];
    commodityDistribution: CommodityDistribution[];
}

export type UnloadingRecord = {
    id: string;
    warehouse_id: string;
    customer_id: string;
    crop_id?: string;
    commodity_description: string;
    bags_unloaded: number;
    bags_remaining: number;
    lorry_tractor_no?: string;
    hamali_amount?: number;
    destination?: 'storage' | 'plot';
    plot_location?: string;
    bags_remaining_in_plot?: number;
    notes?: string;
    unload_date: Date | string;
    created_at: Date | string;
};

export type WithdrawalTransaction = {
    id: string;
    warehouse_id: string;
    storage_record_id: string;
    bags_withdrawn: number;
    withdrawal_date: Date | string;
    rent_collected?: number;
    created_at: Date | string;
    updated_at?: Date | string;
    deleted_at?: Date | string | null;
    deleted_by?: string;
};
