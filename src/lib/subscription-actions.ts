'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';
import * as Sentry from "@sentry/nextjs";

export type SubscriptionState = {
  success: boolean;
  message: string;
  data?: any;
};

/**
 * Get current subscription for a warehouse.
 */
export async function getSubscriptionAction(warehouseId: string) {
  const supabase = createClient();
  const { data, error } = await (await supabase)
    .from('subscriptions')
    .select('*, plans(*)')
    .eq('warehouse_id', warehouseId)
    .single();

  if (error && error.code !== 'PGRST116') {
    Sentry.captureException(error);
    return null;
  }

  // Parallelize fetches for performance
  const [
    { count: totalRecords },
    { count: monthlyRecords },
    { count: totalUsers }
  ] = await Promise.all([
    // 1. Total Storage Records
    (await supabase)
        .from('storage_records')
        .select('*', { count: 'exact', head: true })
        .eq('warehouse_id', warehouseId),
    
    // 2. Monthly Inflows (records created this month)
    (await supabase)
        .from('storage_records')
        .select('*', { count: 'exact', head: true })
        .eq('warehouse_id', warehouseId)
        .gte('created_at', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()),

    // 3. User Count (excluding customers usually, but let's count all non-customer users or just user_warehouses)
    /* Actually 'user_warehouses' gives us the team size */
    (await supabase)
        .from('user_warehouses')
        .select('*', { count: 'exact', head: true })
        .eq('warehouse_id', warehouseId)
  ]);

  return {
    ...data,
    usage: {
        total_records: totalRecords || 0,
        monthly_records: monthlyRecords || 0,
        total_users: totalUsers || 0
    }
  };
}

/**
 * Start a subscription flow.
 */
export async function startSubscriptionAction(
  warehouseId: string,
  planTier: string
): Promise<SubscriptionState> {
  return Sentry.startSpan(
    { op: "action", name: "startSubscriptionAction" },
    async (span) => {
      const supabase = await createClient();

      // 1. Get the plan details
      const { data: plan, error: planError } = await supabase
        .from('plans')
        .select('*')
        .eq('tier', planTier)
        .single();

      if (planError || !plan) {
        return { success: false, message: "Invalid plan selected." };
      }

      if (!plan.razorpay_plan_id && planTier !== 'free') {
          return { success: false, message: "Razorpay Plan ID not configured in database." };
      }

      try {
        // Razorpay integration removed per user request (Manual assignment only)
        
        /* 
        const { error: subError } = await supabase
          .from('subscriptions')
          .upsert({
            warehouse_id: warehouseId,
            plan_id: plan.id,
            status: 'incomplete', // Requires admin approval
            updated_at: new Date().toISOString()
          }, { onConflict: 'warehouse_id' });
        */

        return { 
          success: true, 
          message: "Please contact the Super Admin to activate this plan.", 
        };
      } catch (error: any) {
        Sentry.captureException(error);
        return { success: false, message: error.message || "Failed to initiate subscription." };
      }
    }
  );
}

// --- Admin Actions ---

export async function getAdminAllSubscriptions() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    // Auth Check
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user?.id).single();
    if (!profile || (profile.role !== 'super_admin' && profile.role !== 'owner')) {
        return [];
    }

    // Fetch all warehouses with their subscriptions
    // Note: Supabase returns an array for one-to-many, but usually subscriptions are 1-1 logically here.
    const { data, error } = await supabase
        .from('warehouses')
        .select(`
            id,
            name,
            location,
            subscriptions (
                id,
                status,
                current_period_end,
                plan_id,
                plans (
                    id,
                    name,
                    tier
                )
            )
        `)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching admin subscriptions:', error);
        return [];
    }

    return data.map((w: any) => ({
        warehouseId: w.id,
        warehouseName: w.name,
        location: w.location,
        // If it's an array, take the first one or find the active one.
        // Assuming 1 active sub per warehouse for simplicity
        subscription: Array.isArray(w.subscriptions) ? w.subscriptions[0] : w.subscriptions
    }));
}

export async function getAllPlans() {
    const supabase = await createClient();
    // Use 'price' column as seen in SQL output. 
    // If price is text/numeric, this order should work.
    const { data } = await supabase.from('plans').select('*').order('created_at', { ascending: true });
    return data || [];
}

export async function updateSubscriptionAdmin(
    warehouseId: string, 
    planId: string, 
    status: 'active' | 'incomplete' | 'past_due' | 'canceled' | 'unpaid',
    endDate?: string
): Promise<SubscriptionState> {
    const supabase = await createClient();
    
    // Upsert subscription
    // If no ID exists, it creates one. If exists (by warehouse_id constraint), it updates.
    // Ensure table has unique constraint on warehouse_id
    const { error } = await supabase
        .from('subscriptions')
        .upsert({
            warehouse_id: warehouseId,
            plan_id: planId,
            status: status,
            current_period_end: endDate ? new Date(endDate).toISOString() : null,
            updated_at: new Date().toISOString()
        }, { onConflict: 'warehouse_id' });

    if (error) {
        return { success: false, message: error.message };
    }

    revalidatePath('/admin');
    return { success: true, message: 'Subscription updated successfully' };
}
