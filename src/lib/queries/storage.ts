import { createClient } from '@/utils/supabase/server';
import { cache } from 'react';
import type { StorageRecord } from '@/lib/definitions';
import { logError } from '@/lib/error-logger';
import { getUserWarehouse } from './warehouses';

export const getDashboardMetrics = cache(async () => {
    const supabase = await createClient();
    const warehouseId = await getUserWarehouse();
    if (!warehouseId) return null;

    const { data: lots } = await supabase.from('warehouse_lots').select('capacity, current_stock').eq('warehouse_id', warehouseId);
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
    .is('deleted_at', null)
    .order('storage_start_date', { ascending: false });

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
    .is('deleted_at', null)
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

    const { data, error } = await supabase
        .from('storage_records')
        .select('bags_in, bags_out, bags_stored')
        .eq('warehouse_id', warehouseId)
        .is('deleted_at', null);

    if (error || !data) return { totalInflow: 0, totalOutflow: 0, balanceStock: 0 };

    const totalInflow = data.reduce((acc, r) => acc + (r.bags_in || 0), 0);
    const totalOutflow = data.reduce((acc, r) => acc + (r.bags_out || 0), 0);
    const balanceStock = data.reduce((acc, r) => acc + (r.bags_stored || 0), 0); 
    
    return {
        totalInflow,
        totalOutflow,
        balanceStock
    };
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

export async function getCustomerRecords(customerId: string): Promise<StorageRecord[]> {
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
        .eq('customer_id', customerId)
        .is('deleted_at', null)
        .order('storage_start_date', { ascending: false });

    if (error) return [];

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

export async function getRecentInflows(limit = 5) {
  const supabase = await createClient();
  const warehouseId = await getUserWarehouse();
  if (!warehouseId) return [];

  const { data, error } = await supabase
    .from('storage_records')
    .select(`
      id,
      record_number,
      storage_start_date,
      commodity_description,
      bags_in,
      customer:customers ( name )
    `)
    .eq('warehouse_id', warehouseId)
    .is('deleted_at', null)
    .order('storage_start_date', { ascending: false })
    .limit(limit);

  if (error) return [];

  return data.map((r: any) => ({
    id: r.id,
    recordNumber: r.record_number,
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
    .is('deleted_at', null)
    .order('withdrawal_date', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) return [];

  return data.map((r: any) => ({
    id: r.id,
    invoiceNo: r.storage_record?.outflow_invoice_no || r.storage_record?.record_number || r.storage_record?.id.slice(0,8),
    date: new Date(r.withdrawal_date),
    customerName: r.storage_record?.customer?.name || 'Unknown',
    commodity: r.storage_record?.commodity_description,
    bags: r.bags_withdrawn,
    rentCollected: r.rent_collected || 0,
    maxEditableBags: (r.storage_record?.bags_stored || 0) + r.bags_withdrawn 
  }));
}

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
    .is('deleted_at', null)
    .is('storage_end_date', null)
    .gt('bags_stored', 0) 
    .order('storage_start_date', { ascending: false })
    .limit(limit);

  if (query) {
       if (!isNaN(Number(query))) {
           dbQuery = dbQuery.or(`record_number::text.ilike.%${query}%`);
       } else {
            dbQuery = dbQuery.ilike('customer.name', `%${query}%`);
       }
  }

  const { data, error } = await dbQuery;

  if (error) return [];

  return data.map((r: any) => ({
      id: r.id,
      recordNumber: r.record_number,
      customerName: r.customer?.name,
      commodity: r.commodity_description,
      date: new Date(r.storage_start_date),
      bags: r.bags_stored
  }));
}

export async function getPaginatedStorageRecords(
    page: number = 1, 
    limit: number = 20, 
    search?: string,
    status: 'active' | 'all' | 'released' = 'active'
): Promise<{ records: StorageRecord[], totalCount: number, totalPages: number }> {
    const supabase = await createClient();
    const warehouseId = await getUserWarehouse();
    
    if (!warehouseId) return { records: [], totalCount: 0, totalPages: 0 };

    // Common query builder
    const buildQuery = (isSearchByCustomerName = false) => {
        let query = supabase
            .from('storage_records')
            .select(`
                *,
                payments (*),
                customer:customers${isSearchByCustomerName ? '!inner' : ''}(name)
            `, { count: 'exact' })
            .eq('warehouse_id', warehouseId);

        if (status === 'active') {
            query = query.is('storage_end_date', null).is('deleted_at', null);
        } else if (status === 'released') {
            query = query.not('storage_end_date', 'is', null).is('deleted_at', null);
        }
        // If status is 'all', typically we usually want visible records, so filter deleted too.
        if (status === 'all') {
            query = query.is('deleted_at', null);
        }
        return query;
    };

    let query = buildQuery();

    // Filter by Search
    if (search) {
        if (!isNaN(Number(search))) {
             query = query.eq('record_number', search);
        } else {
             // Search by Customer Name
             query = buildQuery(true) // Switch to inner join
                    .ilike('customer.name', `%${search}%`);
        }
    }

    // Pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    query = query
        .order('storage_start_date', { ascending: false })
        .range(from, to);

    const { data: records, error, count } = await query;

    if (error) {
        logError(error, { operation: 'fetch_paginated_records', warehouseId });
        return { records: [], totalCount: 0, totalPages: 0 };
    }

    return {
        records: mapRecords(records || []),
        totalCount: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
    };
}
