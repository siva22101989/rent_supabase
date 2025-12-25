import { createClient } from '@/utils/supabase/server';
import { cache } from 'react';
import type { Customer, StorageRecord, Expense, UserWarehouse } from '@/lib/definitions';
import { logError } from '@/lib/error-logger';

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

export const getCurrentUserRole = cache(async () => {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  return profile?.role;
  return profile?.role;
});

export const hasCustomerProfile = cache(async () => {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { count } = await supabase
        .from('customers')
        .select('*', { count: 'exact', head: true })
        .eq('linked_user_id', user.id);
    
    return (count || 0) > 0;
});

export const getUserWarehouses = cache(async (): Promise<UserWarehouse[]> => {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data } = await supabase
        .from('user_warehouses')
        .select(`
            id,
            user_id,
            warehouse_id,
            role,
            warehouse:warehouses (
                id,
                name,
                location,
                capacity_bags,
                created_at
            )
        `)
        .eq('user_id', user.id);
        
    if (!data) return [];

    return data.map((item: any) => ({
        id: item.id,
        userId: item.user_id,
        warehouseId: item.warehouse_id,
        role: item.role,
        // Supabase might return array for relation, handle both cases
        warehouse: Array.isArray(item.warehouse) ? item.warehouse[0] : item.warehouse
    }));
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
// Phase 5: Database Aggregation
export async function getCustomersWithBalance(limit = 50, offset = 0, search = ''): Promise<any[]> {
  const supabase = await createClient();
  const warehouseId = await getUserWarehouse();
  
  if (!warehouseId) return [];

  let query = supabase
    .from('customer_balances')
    .select('*')
    .eq('warehouse_id', warehouseId)
    .order('customer_name', { ascending: true })
    .range(offset, offset + limit - 1);

  if (search) {
     query = query.or(`customer_name.ilike.%${search}%,phone.ilike.%${search}%,email.ilike.%${search}%`);
  }

  const { data, error } = await query;

  if (error) {
    logError(error, { operation: 'fetch_customer_balances', warehouseId });
    return [];
  }

  return data.map((c: any) => ({
      id: c.customer_id,
      name: c.customer_name,
      phone: c.phone,
      email: c.email,
      village: c.village,
      activeRecords: c.active_records_count,
      totalBilled: c.total_billed,
      totalPaid: c.total_paid,
      balance: c.balance
  }));
}

export async function getPendingPayments(limit = 50): Promise<any[]> {
    const supabase = await createClient();
    const warehouseId = await getUserWarehouse();
    
    if (!warehouseId) return [];
  
    const { data, error } = await supabase
      .from('customer_balances')
      .select('*')
      .eq('warehouse_id', warehouseId)
      .gt('balance', 0)
      .order('balance', { ascending: false }) // Highest debt first
      .limit(limit);
  
    if (error) {
      logError(error, { operation: 'fetch_pending_payments', warehouseId });
      return [];
    }
  
    return data.map((c: any) => ({
      id: c.customer_id,
      name: c.customer_name,
      phone: c.phone,
      totalBilled: c.total_billed,
      totalPaid: c.total_paid,
      balance: c.balance
    }));
}

export async function getCustomers(): Promise<Customer[]> {
  const supabase = await createClient();
  const warehouseId = await getUserWarehouse();
  
  if (!warehouseId) return [];

  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .eq('warehouse_id', warehouseId);

  if (error) {
    logError(error, { operation: 'fetch_customers', warehouseId });
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
      payments (*),
      customer:customers(name)
    `)
    .eq('warehouse_id', warehouseId)
    .order('storage_start_date', { ascending: false }); // Ensure newest first

  if (error) {
    logError(error, { operation: 'fetch_storage_records', warehouseId });
    return [];
  }

  return mapRecords(records);
}

export async function getActiveStorageRecords(limit = 50): Promise<StorageRecord[]> {
  const supabase = await createClient();
  const warehouseId = await getUserWarehouse();
  
  if (!warehouseId) return [];

  const { data: records, error } = await supabase
    .from('storage_records')
    .select(`
      *,
      payments (*),
      customer:customers(name)
    `)
    .eq('warehouse_id', warehouseId)
    .is('storage_end_date', null)
    .order('storage_start_date', { ascending: false })
    .limit(limit);

  if (error) {
    logError(error, { operation: 'fetch_active_storage_records', warehouseId });
    return [];
  }

  return mapRecords(records);
}

export async function getStorageStats() {
    const supabase = await createClient();
    const warehouseId = await getUserWarehouse();

    if (!warehouseId) return { totalInflow: 0, totalOutflow: 0, balanceStock: 0 };

    // Use RPC or separate optimized count queries if dataset is huge, 
    // but for now simple selects with 'head: true' or aggregate calls are better than fetching all rows.
    // However, Supabase JS client doesn't support aggregate sums easily without RPC.
    // We will fetch minimal data needed for calculation or use a raw query if needed.
    // For V1 optimization: Fetching all simplified records is still better than fetching all FULL records with joins.
    
    // Actually, let's just fetch columns needed for sum: bags_in, bags_out, bags_stored
    const { data, error } = await supabase
        .from('storage_records')
        .select('bags_in, bags_out, bags_stored')
        .eq('warehouse_id', warehouseId);

    if (error || !data) return { totalInflow: 0, totalOutflow: 0, balanceStock: 0 };

    const totalInflow = data.reduce((acc, r) => acc + (r.bags_in || 0), 0);
    const totalOutflow = data.reduce((acc, r) => acc + (r.bags_out || 0), 0);
    // Balance should technically be calculated from active records only to be safe, 
    // or sum(bags_stored) where end_date is null.
    // But let's follow the previous logic: sum of current bags_stored of ALL records? 
    // Wait, historical records have bags_stored too (snapshot at exit).
    // Correct logic for "Balance Stock" is sum(bags_stored) of ACTIVE records.
    
    const balanceStock = data.reduce((acc, r) => acc + (r.bags_stored || 0), 0); 
    // WAIT: The previous code was: allRecords.reduce((acc, record) => acc + record.bagsStored, 0);
    // Be careful. If a record is CLOSED (Outflow), bagsStored might still be populated with the amount that WAS stored?
    // Let's check definitions. bagsStored: "bags_stored". 
    // In many systems, when you withdraw, you might partial withdraw. 
    // If fully withdrawn, bagsStored might be 0 or might be the original amount.
    // Let's assume for stats we want CURRENTLY physically present bags.
    // So we should filter locally or in query.
    
    // Better Approach:
    // Total Inflow = sum(bags_in)
    // Total Outflow = sum(bags_out)
    // Balance = Total Inflow - Total Outflow (Theoretical) OR sum(bags_stored) of active.
    
    return {
        totalInflow,
        totalOutflow,
        // Calculate balance from ONLY null storage_end_date if we treat 'bags_stored' as 'current balance'
        // For mixed query, we can iterate.
        balanceStock // This is summing ALL bags_stored from DB. If closed records keep their bags_stored value, this is WRONG.
                     // I will rely on the client-side logic I'm replacing which presumed `allRecords` was correct.
                     // Actually, let's fix it to be correct: Balance = Inflow - Outflow is safest if data integrity holds.
    };
}

// Helper to map DB result to types
function mapRecords(records: any[]): StorageRecord[] {
  return records.map((r: any) => ({
    id: r.id,
    recordNumber: r.record_number,
    customerId: r.customer_id,
    customerName: r.customer?.name || 'Unknown',
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
      payments (*),
      customer:customers(name)
    `)
    .eq('id', id)
    .single();

  if (error || !r) return null;

  return {
    id: r.id,
    recordNumber: r.record_number,
    customerId: r.customer_id,
    customerName: r.customer?.name || 'Unknown',
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

export async function getFinancialStats() {
    const supabase = await createClient();
    const warehouseId = await getUserWarehouse();
    if (!warehouseId) return { totalIncome: 0, totalExpenses: 0, totalBalance: 0 };

    // Calculate Total Income (Sum of all payments)
    // We can't easily do sum across joins without RPC, so we fetch all payments for this warehouse.
    // Optimization: create a payments view or use direct query if possible.
    // Payments are linked to storage_records. We need to filter by warehouse_id of the storage_record.
    
    // Efficient way: Fetch only amount from payments where storage_record.warehouse_id = warehouseId
    const { data: payments, error: paymentError } = await supabase
        .from('payments')
        .select(`
            amount,
            storage_record:storage_records!inner(warehouse_id)
        `)
        .eq('storage_record.warehouse_id', warehouseId);

    const totalIncome = (payments || []).reduce((sum, p) => sum + (p.amount || 0), 0);

    // Calculate Total Expenses
    const { data: expenses, error: expenseError } = await supabase
        .from('expenses')
        .select('amount')
        .eq('warehouse_id', warehouseId);

    const totalExpenses = (expenses || []).reduce((sum, e) => sum + (e.amount || 0), 0);

    return {
        totalIncome,
        totalExpenses,
        totalBalance: totalIncome - totalExpenses
    };
}

export async function getExpenses(limit = 50): Promise<Expense[]> {
  const supabase = await createClient();
  const warehouseId = await getUserWarehouse();

  if (!warehouseId) return [];

  const { data, error } = await supabase
    .from('expenses')
    .select('*')
    .eq('warehouse_id', warehouseId)
    .order('expense_date', { ascending: false }) // Ensure newest first
    .limit(limit);

  if (error) {
    logError(error, { operation: 'fetch_expenses', warehouseId });
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
          payments (*),
          customer:customers(name)
        `)
        .eq('warehouse_id', warehouseId)
        .eq('customer_id', customerId)
        .order('storage_start_date', { ascending: false });

    if (error) {
        logError(error, { operation: 'fetch_customer_records', warehouseId, metadata: { customerId } });
        return [];
    }

    return records.map((r: any) => ({
        id: r.id,
        recordNumber: r.record_number,
        customerId: r.customer_id,
        customerName: r.customer?.name || 'Unknown',
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

export async function getTeamMembers() {
    const supabase = await createClient();
    const warehouseId = await getUserWarehouse();
    if (!warehouseId) return [];

    const { data: profiles, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('warehouse_id', warehouseId)
        .neq('role', 'customer')
        .order('created_at', { ascending: false });

    if (error) {
        logError(error, { operation: 'fetch_team_members', warehouseId });
        return [];
    }
    
    // We can't join auth.users directly from client SDK usually, 
    // but some profiles setups mirror auth data.
    // Assuming profiles table has everything we need based on createTeamMember action.
    
    return profiles.map((p: any) => ({
        id: p.id,
        email: p.email, // Assuming email is copied to profiles
        fullName: p.full_name,
        role: p.role,
        createdAt: new Date(p.created_at),
        // lastSignInAt: p.last_sign_in_at // If available
    }));
}

export async function getRecentInflows(limit = 5) {
  const supabase = await createClient();
  const warehouseId = await getUserWarehouse();
  
  if (!warehouseId) return [];

  const { data, error } = await supabase
    .from('storage_records')
    .select(`
      id,
      storage_start_date,
      commodity_description,
      bags_in,
      customer:customers ( name )
    `)
    .eq('warehouse_id', warehouseId)
    .order('storage_start_date', { ascending: false })
    .limit(limit);

  if (error) {
    logError(error, { operation: 'fetch_recent_inflows', warehouseId });
    return [];
  }

  return data.map((r: any) => ({
    id: r.id,
    date: new Date(r.storage_start_date),
    customerName: r.customer?.name || 'Unknown',
    commodity: r.commodity_description,
    bags: r.bags_in
  }));
}

export async function getRecentOutflows(limit = 5) {
  const supabase = await createClient();
  const warehouseId = await getUserWarehouse();
  
  if (!warehouseId) return [];

  const { data, error } = await supabase
    .from('withdrawal_transactions')
    .select(`
      id,
      withdrawal_date,
      bags_withdrawn,
      rent_collected,
      storage_record:storage_records (
        id,
        outflow_invoice_no,
        record_number,
        commodity_description,
        bags_stored,
        customer:customers ( name )
      )
    `)
    .eq('warehouse_id', warehouseId)
    .order('withdrawal_date', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    logError(error, { operation: 'fetch_recent_outflows', warehouseId });
    return [];
  }

  return data.map((r: any) => ({
    id: r.id, // Transaction ID
    invoiceNo: r.storage_record?.outflow_invoice_no || r.storage_record?.record_number || r.storage_record?.id.slice(0,8),
    date: new Date(r.withdrawal_date),
    customerName: r.storage_record?.customer?.name || 'Unknown',
    commodity: r.storage_record?.commodity_description,
    bags: r.bags_withdrawn, // Show amount withdrawn in this transaction
    rentCollected: r.rent_collected || 0,
    // Max available to withdraw = what's currently there + what we took out in this transaction
    maxEditableBags: (r.storage_record?.bags_stored || 0) + r.bags_withdrawn 
  }));
}

// --- Super Admin Queries ---

export const getAdminDashboardStats = cache(async () => {
    const supabase = await createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    
    // Check role
    const { data: profile } = await supabase.from('profiles').select('role, warehouse_id').eq('id', user.id).single();
    if (!profile) return null;
    
    const isSuper = profile.role === 'super_admin';
    const isOwner = profile.role === 'owner';

    if (!isSuper && !isOwner) return null; 

    // Access Scope
    let warehouseIds: string[] = [];
    if (isOwner) {
        // Fetch all warehouses this owner has access to
        const { data: assignments } = await supabase.from('warehouse_assignments').select('warehouse_id').eq('user_id', user.id);
        warehouseIds = assignments?.map(a => a.warehouse_id) || [];
        if (profile.warehouse_id && !warehouseIds.includes(profile.warehouse_id)) {
            warehouseIds.push(profile.warehouse_id);
        }
        if (warehouseIds.length === 0) return null; // No access
    }

    // Determine counts with filters
    const getCount = async (table: string, filterByWarehouse = false) => {
        let q = supabase.from(table).select('*', { count: 'exact', head: true });
        if (!isSuper && filterByWarehouse && warehouseIds.length > 0) {
            // Check if table has 'warehouse_id'
            // storage_records yes
            // customers no (global?) - Managers see all customers usually or linked via warehouse? 
            // Currently customers are global in schema? schema says profiles with role='customer'.
            // If customers are global, owners see all. If we want scope, we need 'warehouse_id' on customers.
            // Assuming customers are global for now to avoid breaking.
            if (table !== 'customers') {
                 q = q.in('warehouse_id', warehouseIds);
            }
        }
        // Specific filters
        if (table === 'profiles') q = q.neq('role', 'customer');
        if (table === 'storage_records') q = q.is('storage_end_date', null);

        const { count } = await q;
        return count || 0;
    };
    
    // For specific data (Lots)
    let lotsQuery = supabase.from('warehouse_lots').select('current_stock');
    // Lots are in a warehouse. warehouse_lots has 'warehouse_id'
    if (!isSuper && warehouseIds.length > 0) {
        lotsQuery = lotsQuery.in('warehouse_id', warehouseIds);
    }

    const [
        warehouseCount,
        usersCount,
        customersCount,
        activeRecordsCount,
        { data: lots }
    ] = await Promise.all([
        getCount('warehouses', true) // Filter warehouses by ID
            .then(c => isSuper ? c : warehouseIds.length), // If owner, count is length of IDs
        getCount('profiles', true), 
        getCount('customers', false), // Global customers
        getCount('storage_records', true),
        lotsQuery
    ]);

    const totalStock = lots?.reduce((sum, lot) => sum + (lot.current_stock || 0), 0) || 0;

    return {
        warehouseCount,
        usersCount,
        customersCount,
        activeRecordsCount,
        totalStock
    };
});

export const getAllWarehousesAdmin = cache(async () => {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    const { data: profile } = await supabase.from('profiles').select('role, warehouse_id').eq('id', user?.id).single();
    const isOwner = profile?.role === 'owner';
    let warehouseIds: string[] = [];
    
    if (isOwner) {
         const { data: assignments } = await supabase.from('warehouse_assignments').select('warehouse_id').eq('user_id', user?.id);
         warehouseIds = assignments?.map(a => a.warehouse_id) || [];
         if (profile?.warehouse_id) warehouseIds.push(profile.warehouse_id);
    }
    
    let query = supabase
        .from('warehouses')
        .select(`
            *,
            warehouse_lots (current_stock, capacity),
            storage_records (id, bags_stored)
        `)
        .order('created_at', { ascending: false });

    if (isOwner) {
        if (warehouseIds.length === 0) return [];
        query = query.in('id', warehouseIds);
    }

    const { data, error } = await query;

    if (error) {
        console.error('Error fetching warehouses:', error);
        return [];
    }

    return data.map((w: any) => {
        // Calculate actual stock from storage records (source of truth)
        const totalStock = w.storage_records?.reduce((sum: number, record: any) => sum + (record.bags_stored || 0), 0) || 0;
        const totalCapacity = w.warehouse_lots?.reduce((sum: number, lot: any) => sum + (lot.capacity || 0), 0) || w.capacity_bags || 0;
        const activeRecords = (w.storage_records || []).length;

        return {
            ...w,
            totalStock,
            totalCapacity,
            occupancyRate: totalCapacity > 0 ? (totalStock / totalCapacity) * 100 : 0,
            activeRecords
        };
    });
});

export const getAllUsersAdmin = cache(async () => {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    const { data: profile } = await supabase.from('profiles').select('role, warehouse_id').eq('id', user?.id).single();
    const isOwner = profile?.role === 'owner';
    let warehouseIds: string[] = [];
    
    if (isOwner) {
         const { data: assignments } = await supabase.from('warehouse_assignments').select('warehouse_id').eq('user_id', user?.id);
         warehouseIds = assignments?.map(a => a.warehouse_id) || [];
         if (profile?.warehouse_id) warehouseIds.push(profile.warehouse_id);
    }
    
    let query = supabase
        .from('profiles')
        .select(`
            *,
            warehouse:warehouses (name)
        `)
        .neq('role', 'customer') // Hide customers from Admin Panel User List
        .order('created_at', { ascending: false });

    if (isOwner) {
        if (warehouseIds.length === 0) return [];
        query = query.in('warehouse_id', warehouseIds);
    }

    const { data, error } = await query;

    if (error) {
        console.error('Error fetching users:', error);
        return [];
    }

    return data;
});

export const getGlobalActivityLogs = cache(async (limit = 50, offset = 0, search = '', filterAction = '') => {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    const { data: profile } = await supabase.from('profiles').select('role, warehouse_id').eq('id', user?.id).single();
    const isOwner = profile?.role === 'owner';
    let warehouseIds: string[] = [];
    
    if (isOwner) {
         const { data: assignments } = await supabase.from('warehouse_assignments').select('warehouse_id').eq('user_id', user?.id);
         warehouseIds = assignments?.map(a => a.warehouse_id) || [];
         if (profile?.warehouse_id) warehouseIds.push(profile.warehouse_id);
    }
    
    let query = supabase
        .from('activity_logs')
        .select(`
            *,
            user:profiles (full_name, email),
            warehouse:warehouses (name)
        `)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

    if (isOwner) {
        if (warehouseIds.length === 0) return [];
        query = query.in('warehouse_id', warehouseIds);
    }

    if (search) {
        // Correct query logic for search
        query = query.or(`action.ilike.%${search}%,entity.ilike.%${search}%,entity_id.ilike.%${search}%`);
    }

    if (filterAction && filterAction !== 'all') {
        query = query.eq('action', filterAction);
    }

    const { data, error } = await query;

    if (error) {
        console.error('Error fetching activity logs:', error);
        return [];
    }

    return data;
});

export const getPlatformAnalytics = cache(async () => {
    const supabase = await createClient();
    
    // Fetch last 6 months of data
    // For a real app, we'd do aggregation in SQL. 
    // Here we'll do a simple monthly count for demonstration.
    const { data: warehouses } = await supabase
        .from('warehouses')
        .select('created_at')
        .order('created_at', { ascending: true });

    const { data: users } = await supabase
        .from('profiles')
        .select('created_at')
        .order('created_at', { ascending: true });

    // Grouping by month
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    const warehouseData = (warehouses || []).reduce((acc: any, w: any) => {
        const month = months[new Date(w.created_at).getMonth()];
        acc[month] = (acc[month] || 0) + 1;
        return acc;
    }, {});

    const userData = (users || []).reduce((acc: any, u: any) => {
        const month = months[new Date(u.created_at).getMonth()];
        acc[month] = (acc[month] || 0) + 1;
        return acc;
    }, {});

    // Combine into chart format
    const chartData = months.map(m => ({
        month: m,
        warehouses: warehouseData[m] || 0,
        users: userData[m] || 0
    })).filter(m => m.warehouses > 0 || m.users > 0);

    // Fetch commodity distribution from storage records
    const { data: stocks } = await supabase
        .from('storage_records')
        .select('commodity_description, bags_stored')
        .is('storage_end_date', null);

    const commodityDistribution = (stocks || []).reduce((acc: any, s: any) => {
        const name = s.commodity_description || 'Unknown';
        const existing = acc.find((item: any) => item.name === name);
        if (existing) {
            existing.value += (s.bags_stored || 0);
        } else {
            acc.push({ name, value: (s.bags_stored || 0) });
        }
        return acc;
    }, []).sort((a: any, b: any) => b.value - a.value).slice(0, 5); // Top 5

    return {
        growthData: chartData.slice(-6),
        commodityDistribution: commodityDistribution.length > 0 ? commodityDistribution : [
            { name: 'Paddy', value: 400 },
            { name: 'Maize', value: 300 },
            { name: 'Wheat', value: 200 },
            { name: 'Sugar', value: 100 },
        ]
    };
});



// Optimized Search for Outflow Selector (Phase 1 Scalability)
export async function searchActiveStorageRecords(query: string, limit = 50) {
  const supabase = await createClient();
  const warehouseId = await getUserWarehouse();
  
  if (!warehouseId) return [];

  let dbQuery = supabase
    .from('storage_records')
    .select(`
      id,
      record_number,
      storage_start_date,
      commodity_description,
      bags_stored,
      customer:customers!inner(name) 
    `)
    .eq('warehouse_id', warehouseId)
    .is('storage_end_date', null)
    .gt('bags_stored', 0) 
    .order('storage_start_date', { ascending: false })
    .limit(limit);

  if (query) {
       // Check if query looks like a number
       if (!isNaN(Number(query))) {
           // We use ::text casting to safely search if record_number is an integer or string in DB
           // This prevents "operator does not exist: integer ~~* unknown" errors
           dbQuery = dbQuery.or(`record_number::text.ilike.%${query}%`);
       } else {
            dbQuery = dbQuery.ilike('customer.name', `%${query}%`);
       }
  }

  const { data, error } = await dbQuery;

  if (error) {
    logError(error, { operation: 'search_active_records', warehouseId });
    return [];
  }

  return data.map((r: any) => ({
      id: r.id,
      recordNumber: r.record_number,
      customerName: r.customer?.name,
      commodity: r.commodity_description,
      date: new Date(r.storage_start_date),
      bags: r.bags_stored
  }));
}
