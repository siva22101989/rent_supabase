import { createClient } from '@/utils/supabase/server';
import { cache } from 'react';
import type { Customer, CustomerWithBalance } from '@/lib/definitions';
import { logError } from '@/lib/error-logger';
import { getUserWarehouse } from './warehouses';

interface CustomerBalanceRow {
  customer_id: string;
  customer_name: string;
  phone: string;
  email?: string;
  village: string;
  active_records_count: number;
  total_billed: number;
  total_paid: number;
  balance: number;
  address?: string; // These might be null in view if not joined/propagated correctly
  father_name?: string;
}

export const getCustomersWithBalance = cache(async (limit = 50, offset = 0, search = ''): Promise<CustomerWithBalance[]> => {
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

  return (data as CustomerBalanceRow[]).map((c) => ({
      id: c.customer_id,
      name: c.customer_name,
      phone: c.phone,
      email: c.email || '',
      village: c.village || '',
      address: c.address || '',
      fatherName: c.father_name || '',
      activeRecords: c.active_records_count,
      totalBilled: c.total_billed,
      totalPaid: c.total_paid,
      balance: c.balance
  }));
});

export const getPendingPayments = cache(async (limit = 50): Promise<Partial<CustomerWithBalance>[]> => {
    const supabase = await createClient();
    const warehouseId = await getUserWarehouse();
    
    if (!warehouseId) return [];
  
    const { data, error } = await supabase
      .from('customer_balances')
      .select('*')
      .eq('warehouse_id', warehouseId)
      .gt('balance', 0)
      .order('balance', { ascending: false })
      .limit(limit);
  
    if (error) {
      logError(error, { operation: 'fetch_pending_payments', warehouseId });
      return [];
    }
  
    return (data as CustomerBalanceRow[]).map((c) => ({
      id: c.customer_id,
      name: c.customer_name,
      phone: c.phone,
      email: c.email || '',
      village: c.village || '',
      address: c.address || '',
      fatherName: c.father_name || '',
      totalBilled: c.total_billed,
      totalPaid: c.total_paid,
      balance: c.balance
    }));
});

export const getCustomers = cache(async (): Promise<Customer[]> => {
  const supabase = await createClient();
  const warehouseId = await getUserWarehouse();
  
  if (!warehouseId) return [];

  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .eq('warehouse_id', warehouseId)
    .is('deleted_at', null);

  if (error) {
    logError(error, { operation: 'fetch_customers', warehouseId });
    return [];
  }

  return (data as any[]).map((c) => ({
    id: c.id,
    name: c.name,
    phone: c.phone,
    email: c.email || '',
    address: c.address,
    fatherName: c.father_name || '',
    village: c.village || '',
  }));
});

export const getCustomer = cache(async (id: string): Promise<Customer | null> => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .eq('id', id)
    .is('deleted_at', null)
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
});
