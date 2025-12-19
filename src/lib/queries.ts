import { createClient } from '@/utils/supabase/server';
import { cache } from 'react';
import type { Customer, StorageRecord, Expense } from '@/lib/definitions';

// Helper to get current user's warehouse
export const getUserWarehouse = cache(async () => {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('warehouse_id')
    .eq('id', user.id)
    .single();

  return profile?.warehouse_id;
});

// Helper to get warehouse details
export const getWarehouseDetails = cache(async () => {
  const supabase = await createClient();
  const warehouseId = await getUserWarehouse();
  if (!warehouseId) return null;

  const { data } = await supabase
    .from('warehouses')
    .select('*')
    .eq('id', warehouseId)
    .single();

  return data;
});

// Helper to fetch crops
export const getAvailableCrops = cache(async () => {
    const supabase = await createClient();
    const warehouseId = await getUserWarehouse();
    if (!warehouseId) return [];

    const { data } = await supabase.from('crops').select('*').eq('warehouse_id', warehouseId).order('name');
    return data || [];
});

export const getAvailableLots = cache(async () => {
    const supabase = await createClient();
    const warehouseId = await getUserWarehouse();
    if (!warehouseId) return [];

    const { data } = await supabase.from('warehouse_lots').select('*').eq('warehouse_id', warehouseId).order('name');
    return data || [];
});

export const getDashboardMetrics = cache(async () => {
    const supabase = await createClient();
    const warehouseId = await getUserWarehouse();
    if (!warehouseId) return null;

    // Fetch Lots for Capacity/Stock
    const { data: lots } = await supabase.from('warehouse_lots').select('capacity, current_stock').eq('warehouse_id', warehouseId);
    
    // Fetch Storage Records for Financials (Simplified)
    const { count: activeRecordsCount } = await supabase
        .from('storage_records')
        .select('*', { count: 'exact', head: true })
        .eq('warehouse_id', warehouseId)
        .is('storage_end_date', null);

    let totalCapacity = 0;
    let totalStock = 0;
    if (lots) {
        totalCapacity = lots.reduce((acc, lot) => acc + (lot.capacity || 1000), 0);
        totalStock = lots.reduce((acc, lot) => acc + (lot.current_stock || 0), 0);
    }

    return {
        totalCapacity,
        totalStock,
        occupancyRate: totalCapacity > 0 ? (totalStock / totalCapacity) * 100 : 0,
        activeRecordsCount: activeRecordsCount || 0
    };
});

// Customer Functions (Read)
export async function getCustomers(): Promise<Customer[]> {
  const supabase = await createClient();
  const warehouseId = await getUserWarehouse();
  
  if (!warehouseId) return [];

  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .eq('warehouse_id', warehouseId);

  if (error) {
    console.error('Error fetching customers:', error);
    return [];
  }

  return data.map((c: any) => ({
    id: c.id,
    name: c.name,
    phone: c.phone,
    email: c.email || '',
    address: c.address,
    fatherName: c.father_name || '',
    village: c.village || '',
  }));
}

export const getCustomer = async (id: string): Promise<Customer | null> => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) return null;

  return {
    id: data.id,
    name: data.name,
    phone: data.phone,
    email: data.email || '',
    address: data.address,
    fatherName: data.father_name || '',
    village: data.village || '',
  };
};

// Storage Record Functions (Read)
// MAPPERS to include record_number and payment_number

export async function getStorageRecords(): Promise<StorageRecord[]> {
  const supabase = await createClient();
  const warehouseId = await getUserWarehouse();
  
  if (!warehouseId) return [];

  const { data: records, error } = await supabase
    .from('storage_records')
    .select(`
      *,
      payments (*)
    `)
    .eq('warehouse_id', warehouseId);

  if (error) {
    console.error('Error fetching storage records:', error);
    return [];
  }

  return records.map((r: any) => ({
    id: r.id,
    recordNumber: r.record_number,
    customerId: r.customer_id,
    cropId: r.crop_id,
    commodityDescription: r.commodity_description,
    location: r.location,
    bagsIn: r.bags_in || r.bags_stored,
    bagsOut: r.bags_out || 0,
    bagsStored: r.bags_stored,
    storageStartDate: new Date(r.storage_start_date),
    storageEndDate: r.storage_end_date ? new Date(r.storage_end_date) : null,
    billingCycle: r.billing_cycle,
    payments: (r.payments || []).map((p: any) => ({
      amount: p.amount,
      date: new Date(p.payment_date),
      type: p.type || 'other',
      notes: p.notes,
      paymentNumber: p.payment_number
    })),
    hamaliPayable: r.hamali_payable,
    totalRentBilled: r.total_rent_billed,
    lorryTractorNo: r.lorry_tractor_no,
    inflowType: r.inflow_type,
    plotBags: r.plot_bags,
    loadBags: r.load_bags,
    khataAmount: r.khata_amount,

  }));
}

export const getStorageRecord = async (id: string): Promise<StorageRecord | null> => {
  const supabase = await createClient();
  const { data: r, error } = await supabase
    .from('storage_records')
    .select(`
      *,
      payments (*)
    `)
    .eq('id', id)
    .single();

  if (error || !r) return null;

  return {
    id: r.id,
    recordNumber: r.record_number,
    customerId: r.customer_id,
    cropId: r.crop_id,
    commodityDescription: r.commodity_description,
    location: r.location,
    bagsIn: r.bags_in || r.bags_stored,
    bagsOut: r.bags_out || 0,
    bagsStored: r.bags_stored,
    storageStartDate: new Date(r.storage_start_date),
    storageEndDate: r.storage_end_date ? new Date(r.storage_end_date) : null,
    billingCycle: r.billing_cycle,
     payments: (r.payments || []).map((p: any) => ({
      amount: p.amount,
      date: new Date(p.payment_date),
      type: p.type || 'other', 
      notes: p.notes,
      paymentNumber: p.payment_number
    })),
    hamaliPayable: r.hamali_payable,
    totalRentBilled: r.total_rent_billed,
    lorryTractorNo: r.lorry_tractor_no,
    inflowType: r.inflow_type,
    plotBags: r.plot_bags,
    loadBags: r.load_bags,
    khataAmount: r.khata_amount
  };
};

export async function getExpenses(): Promise<Expense[]> {
  const supabase = await createClient();
  const warehouseId = await getUserWarehouse();

  if (!warehouseId) return [];

  const { data, error } = await supabase
    .from('expenses')
    .select('*')
    .eq('warehouse_id', warehouseId);

  if (error) {
    console.error('Error fetching expenses:', error);
    return [];
  }

  return data.map((e: any) => ({
    id: e.id,
    description: e.description,
    amount: e.amount,
    date: new Date(e.expense_date),
    category: e.category,
  }));
}

export async function getNotifications(limit = 5): Promise<any[]> {
    const supabase = await createClient();
    const warehouseId = await getUserWarehouse();
    const { data: { user } } = await supabase.auth.getUser();

    if (!warehouseId || !user) return [];

    const { data } = await supabase
        .from('notifications')
        .select('*')
        .or(`user_id.eq.${user.id},user_id.is.null`)
        .eq('warehouse_id', warehouseId)
        .order('created_at', { ascending: false })
        .limit(limit);

    return data || [];
}

export async function getCustomerRecords(customerId: string): Promise<StorageRecord[]> {
    const supabase = await createClient();
    const warehouseId = await getUserWarehouse();

    if (!warehouseId) return [];

    // Optimized: Single query with join instead of nested queries
    const { data: records, error } = await supabase
        .from('storage_records')
        .select(`
          *,
          payments (*)
        `)
        .eq('warehouse_id', warehouseId)
        .eq('customer_id', customerId)
        .order('storage_start_date', { ascending: false });

    if (error) {
        console.error('Error fetching customer records:', error);
        return [];
    }

    return records.map((r: any) => ({
        id: r.id,
        recordNumber: r.record_number,
        customerId: r.customer_id,
        cropId: r.crop_id,
        commodityDescription: r.commodity_description,
        location: r.location,
        bagsIn: r.bags_in || r.bags_stored, // Ensure we use original bags_in
        bagsOut: r.bags_out || 0,
        bagsStored: r.bags_stored,
        storageStartDate: new Date(r.storage_start_date),
        storageEndDate: r.storage_end_date ? new Date(r.storage_end_date) : null,
        billingCycle: r.billing_cycle,
        payments: (r.payments || []).map((p: any) => ({
            amount: p.amount,
            date: new Date(p.payment_date),
            type: p.payment_type || 'other',
            notes: p.notes,
            paymentNumber: p.payment_number
        })),
        hamaliPayable: r.hamali_payable,
        totalRentBilled: r.total_rent_billed,
        lorryTractorNo: r.lorry_tractor_no,
        inflowType: r.inflow_type,
        plotBags: r.plot_bags,
        loadBags: r.load_bags,
        khataAmount: r.khata_amount,
    }));
}
