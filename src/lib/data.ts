
import { createClient } from '@/utils/supabase/server';
import type { Customer, StorageRecord, Payment, Expense } from '@/lib/definitions';
import { revalidatePath } from 'next/cache';



export const getUserWarehouse = async () => {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('warehouse_id')
    .eq('id', user.id)
    .single();

  return profile?.warehouse_id;
};

export const getAvailableCrops = async () => {
    const supabase = await createClient();
    const warehouseId = await getUserWarehouse();
    if (!warehouseId) return [];

    const { data } = await supabase.from('crops').select('*').eq('warehouse_id', warehouseId).order('name');
    return data || [];
};

export const getAvailableLots = async () => {
    const supabase = await createClient();
    const warehouseId = await getUserWarehouse();
    if (!warehouseId) return [];

    const { data } = await supabase.from('warehouse_lots').select('*').eq('warehouse_id', warehouseId).order('name');
    return data || [];
};

export const getDashboardMetrics = async () => {
    const supabase = await createClient();
    const warehouseId = await getUserWarehouse();
    if (!warehouseId) return null;

    // Fetch Lots for Capacity/Stock
    const { data: lots } = await supabase.from('warehouse_lots').select('capacity, current_stock').eq('warehouse_id', warehouseId);
    
    // Fetch Storage Records for Financials (Simplified)
    // In a real app, we'd have a 'balance' field or aggregation table. 
    // Here we will sum 'total_rent_billed' - sum 'payments'? Or just show active records count.
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
};

// Customer Functions
export async function customers(): Promise<Customer[]> {
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

  // Map database fields to application types if needed (snake_case to camelCase)
  // Assuming the DB uses snake_case and app uses camelCase, we might need a mapper or just update definitions.
  // For now, I'll assume we need to map basics.
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

export const saveCustomer = async (customer: Customer): Promise<void> => {
  'use server';
  const supabase = await createClient();
  const warehouseId = await getUserWarehouse();

  if (!warehouseId) throw new Error("No warehouse assigned to user");

  const { error } = await supabase.from('customers').insert({
    // We let Supabase generate ID if it's new, but here we might be passing an ID.
    // If the ID is 'CUST-...', we should probably let Supabase generate a UUID instead.
    // However, to keep compatibility with the app's expecting an ID, we'll strip it if it's a temp one
    // or we just pass the fields.
    name: customer.name,
    phone: customer.phone,
    email: customer.email,
    address: customer.address,
    father_name: customer.fatherName,
    village: customer.village,
    warehouse_id: warehouseId
  });

  if (error) throw error;
};



// Storage Record Functions
export async function storageRecords(): Promise<StorageRecord[]> {
  const supabase = await createClient();
  const warehouseId = await getUserWarehouse();
  
  if (!warehouseId) return [];

  // Fetch records with their payments
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
    customerId: r.customer_id,
    cropId: r.crop_id,
    commodityDescription: r.commodity_description, // Or fetch crop name if migrating fully
    location: r.location,
    bagsIn: r.bags_stored,
    bagsOut: 0,
    bagsStored: r.bags_stored,
    storageStartDate: new Date(r.storage_start_date),
    storageEndDate: r.storage_end_date ? new Date(r.storage_end_date) : null,
    billingCycle: r.billing_cycle,
    payments: (r.payments || []).map((p: any) => ({
      amount: p.amount,
      date: new Date(p.payment_date),
      type: 'other', // Default or infer
      notes: p.notes
    })),
    hamaliPayable: r.hamali_payable,
    totalRentBilled: r.total_rent_billed,
    lorryTractorNo: r.lorry_tractor_no,
    weight: r.weight,
    inflowType: r.inflow_type,
    plotBags: r.plot_bags,
    loadBags: r.load_bags,
    khataAmount: r.khata_amount,
    outflowInvoiceNo: r.outflow_invoice_no
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
    customerId: r.customer_id,
    cropId: r.crop_id,
    commodityDescription: r.commodity_description,
    location: r.location,
    bagsIn: r.bags_stored,
    bagsOut: 0,
    bagsStored: r.bags_stored,
    storageStartDate: new Date(r.storage_start_date),
    storageEndDate: r.storage_end_date ? new Date(r.storage_end_date) : null,
    billingCycle: r.billing_cycle,
    payments: (r.payments || []).map((p: any) => ({
      amount: p.amount,
      date: new Date(p.payment_date),
      type: 'other', 
      notes: p.notes
    })),
    hamaliPayable: r.hamali_payable,
    totalRentBilled: r.total_rent_billed,
    lorryTractorNo: r.lorry_tractor_no,
    weight: r.weight,
    inflowType: r.inflow_type,
    plotBags: r.plot_bags,
    loadBags: r.load_bags,
    khataAmount: r.khata_amount,
    outflowInvoiceNo: r.outflow_invoice_no
  };
};

export const saveStorageRecord = async (record: StorageRecord): Promise<any> => {
  'use server';
  const supabase = await createClient();
  const warehouseId = await getUserWarehouse();

  if (!warehouseId) throw new Error("No warehouse assigned");

  const recordPayload = {
    customer_id: record.customerId,
    commodity_description: record.commodityDescription,
    location: record.location,
    bags_stored: record.bagsStored,
    weight: record.weight,
    lorry_tractor_no: record.lorryTractorNo,
    inflow_type: record.inflowType,
    plot_bags: record.plotBags,
    load_bags: record.loadBags,
    khata_amount: record.khataAmount,
    storage_start_date: record.storageStartDate,
    storage_end_date: record.storageEndDate,
    billing_cycle: record.billingCycle || '6-Month Initial',
    hamali_payable: record.hamaliPayable,
    total_rent_billed: record.totalRentBilled,
    warehouse_id: warehouseId,
    lot_id: record.lotId,
    crop_id: record.cropId
  };

  let paymentPayload = null;
  if (record.payments && record.payments.length > 0) {
    const p = record.payments[0];
    paymentPayload = {
        amount: p.amount,
        date: p.date,
        notes: p.type === 'hamali' ? 'Hamali' : (p.notes || 'Initial Payment')
    };
  }

  const { data, error } = await supabase.rpc('create_storage_record_with_payment', {
    p_record: recordPayload,
    p_payment: paymentPayload
  });

  if (error) throw error;

  return { id: data.id };
};

export const updateStorageRecord = async (id: string, data: Partial<StorageRecord>): Promise<void> => {
    'use server';
    const supabase = await createClient();
    
    // Map partial data to DB columns
    const dbData: any = {};
    if (data.customerId) dbData.customer_id = data.customerId;
    if (data.cropId) dbData.crop_id = data.cropId;
    if (data.commodityDescription) dbData.commodity_description = data.commodityDescription;
    if (data.location) dbData.location = data.location;
    if (data.bagsStored !== undefined) dbData.bags_stored = data.bagsStored;
    if (data.weight !== undefined) dbData.weight = data.weight;
    if (data.storageStartDate) dbData.storage_start_date = data.storageStartDate;
    if (data.storageEndDate) dbData.storage_end_date = data.storageEndDate;
    if (data.billingCycle) dbData.billing_cycle = data.billingCycle;
    if (data.hamaliPayable !== undefined) dbData.hamali_payable = data.hamaliPayable;
    if (data.totalRentBilled !== undefined) dbData.total_rent_billed = data.totalRentBilled;

    const { error } = await supabase
        .from('storage_records')
        .update(dbData)
        .eq('id', id);

    if (error) throw error;
    
    // Note: Updating payments via this function is complex if we replace the whole array.
    // Ideally, we use addPaymentToRecord. If the intent is to replace all, we'd delete and re-insert.
    // For now, I'll assume this function is mostly for record fields, not deep payment updates.
}

export const deleteStorageRecord = async (id: string): Promise<void> => {
    'use server';
    const supabase = await createClient();
    const { error } = await supabase.from('storage_records').delete().eq('id', id);
    if (error) throw error;
};

export const addPaymentToRecord = async (recordId: string, payment: Payment) => {
    'use server';
    const supabase = await createClient();
    const { error } = await supabase.from('payments').insert({
        storage_record_id: recordId,
        amount: payment.amount,
        payment_date: payment.date,
        notes: payment.type // mapping type to notes or add a type column if needed. 
    });
    if (error) throw error;
}



// Expense Functions
export async function expenses(): Promise<Expense[]> {
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

export async function saveExpense(expense: Expense): Promise<void> {
  'use server';
  const supabase = await createClient();
  const warehouseId = await getUserWarehouse();

  if (!warehouseId) throw new Error("No warehouse assigned");

  const { error } = await supabase.from('expenses').insert({
    description: expense.description,
    amount: expense.amount,
    category: expense.category,
    expense_date: expense.date,
    warehouse_id: warehouseId
  });

  if (error) throw error;
}

export const updateExpense = async (id: string, data: Partial<Expense>): Promise<void> => {
    'use server';
    const supabase = await createClient();
    
    // Map partial app type to DB columns
    const dbData: any = {};
    if (data.description) dbData.description = data.description;
    if (data.amount !== undefined) dbData.amount = data.amount;
    if (data.category) dbData.category = data.category;
    if (data.date) dbData.expense_date = data.date;

    const { error } = await supabase
        .from('expenses')
        .update(dbData)
        .eq('id', id);

    if (error) throw error;
};

export const deleteExpense = async (id: string): Promise<void> => {
    'use server';
    const supabase = await createClient();
    const { error } = await supabase.from('expenses').delete().eq('id', id);
    if (error) throw error;
};
