'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';
import * as Sentry from "@sentry/nextjs";
import { logError } from './error-logger';

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
    logError(error, { operation: 'getSubscriptionAction', metadata: { warehouseId } });
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
        .eq('warehouse_id', warehouseId)
        .is('deleted_at', null),
    
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
/**
 * Check if the warehouse is allowed to perform an action based on subscription limits.
 */
export async function checkSubscriptionLimits(warehouseId: string, action: 'add_record' | 'add_user'): Promise<{ allowed: boolean; message?: string }> {
    const subscription = await getSubscriptionAction(warehouseId);
    
    if (!subscription) {
        // Fallback or Strict? Strict: No sub = Free Tier rules.
        // Assuming no sub means "Free Tier" (default)
        // We should fetch free plan limits physically or hardcode them as failsafe.
        // For now, let's treat "no subscription record" as "Free Tier" with 50 record limit.
        // Ideally, we fetch the "free" plan from DB.
        
        // Quick verify of current count
        const supabase = await createClient();
        const { count } = await supabase.from('storage_records').select('*', { count: 'exact', head: true }).eq('warehouse_id', warehouseId).is('deleted_at', null);
        
        const FREE_LIMIT = 50;
        if ((count || 0) >= FREE_LIMIT && action === 'add_record') {
             return { allowed: false, message: `Free Tier limit reached (${FREE_LIMIT} records). Please upgrade to add more.` };
        }
        return { allowed: true };
    }

    const { plans, status: rawStatus, usage } = subscription;
    // Default to 'active' to be permissive for legacy data/undefined status
    const status = rawStatus || 'active';
    
    if (status !== 'active' && status !== 'trialing') {
         return { allowed: false, message: `Subscription is ${status}. Please renew to continue.` };
    }

    // Auto-expire check: If active but past end date
    if (subscription.current_period_end && new Date(subscription.current_period_end) < new Date()) {
         return { allowed: false, message: "Subscription period has ended. Please renew to continue." };
    }

    if (action === 'add_record') {
        const limit = plans?.max_storage_records;
        // if limit is null/undefined, assume unlimited (Enterprise)
        if (limit && usage.total_records >= limit) {
             return { allowed: false, message: `Plan limit reached (${limit} records). Please upgrade.` };
        }
    }
    
    return { allowed: true };
}

/**
 * Check if the warehouse has access to a specific feature.
 */
export async function checkFeatureAccess(warehouseId: string, feature: 'allow_sms' | 'allow_export' | 'allow_multi_warehouse' | 'allow_api'): Promise<{ allowed: boolean; message?: string }> {
    const subscription = await getSubscriptionAction(warehouseId);
    
    if (!subscription) {
        // Free tier defaults
        // Assuming free tier has NO advanced features
        return { allowed: false, message: "Upgrade to access this feature." };
    }

    const { plans, status } = subscription;
    
    // Check subscription status
    if (status !== 'active' && status !== 'trialing') {
         return { allowed: false, message: "Subscription inactive. Please renew." };
    }

    if (subscription.current_period_end && new Date(subscription.current_period_end) < new Date()) {
          return { allowed: false, message: "Subscription expired. Please renew." };
    }

    // Check plan features JSON
    const features = plans?.features as any;
    if (!features || !features[feature]) {
         return { allowed: false, message: `Your current plan (${plans?.name}) does not support this feature.` };
    }

    return { allowed: true };
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

      // Razorpay check skipped for manual flow
      /*
      if (!plan.razorpay_plan_id && planTier !== 'free') {
          return { success: false, message: "Razorpay Plan ID not configured in database." };
      }
      */

      try {
        // Create an 'incomplete' subscription to signal intent to Admin
        const { error: subError } = await supabase
          .from('subscriptions')
          .upsert({
            warehouse_id: warehouseId,
            plan_id: plan.id,
            status: 'incomplete', // Signal for admin approval/payment
            updated_at: new Date().toISOString()
          }, { onConflict: 'warehouse_id' });
        
        if (subError) throw subError;

        return { 
          success: true, 
          message: "Request logged. Please contact the Super Admin to activate this plan.", 
        };
      } catch (error: any) {
        logError(error, { operation: 'startSubscriptionAction', metadata: { warehouseId, planTier } });
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
        logError(error, { operation: 'getAdminAllSubscriptions' });
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
    'use server';
    const supabase = await createClient();
    const { data } = await supabase.from('plans').select('*').order('created_at', { ascending: true });
    return data || [];
}

export async function updateSubscriptionAdmin(
    warehouseId: string, 
    planId: string, 
    status: 'active' | 'incomplete' | 'past_due' | 'canceled' | 'unpaid' | 'trialing' | 'grace_period' | 'expired',
    endDate?: string
): Promise<SubscriptionState> {
    const supabase = await createClient();
    
    // Build update object
    const updateData: any = {
        warehouse_id: warehouseId,
        plan_id: planId,
        status: status,
        current_period_end: endDate ? new Date(endDate).toISOString() : null,
        updated_at: new Date().toISOString()
    };
    
    // SAFEGUARD 1: If admin sets status to 'active' with a future end date, clear grace period
    // This handles manual renewals during grace period
    if (status === 'active' && endDate) {
        const endDateTime = new Date(endDate).getTime();
        const now = Date.now();
        
        if (endDateTime > now) {
            // Future date = renewal, clear grace period
            updateData.grace_period_end = null;
            updateData.grace_period_notified = false;
        }
    }
    
    // SAFEGUARD 2: If admin explicitly sets status to 'grace_period', calculate grace_period_end
    if (status === 'grace_period' && endDate) {
        const graceDays = 7;
        const endDateTime = new Date(endDate).getTime();
        updateData.grace_period_end = new Date(endDateTime + graceDays * 24 * 60 * 60 * 1000).toISOString();
        updateData.grace_period_notified = false;
    }
    
    // SAFEGUARD 3: If changing from grace_period to any other active status, clear grace period
    if (status !== 'grace_period' && status !== 'expired') {
        updateData.grace_period_end = null;
        updateData.grace_period_notified = false;
    }
    
    // Upsert subscription
    const { error } = await supabase
        .from('subscriptions')
        .upsert(updateData, { onConflict: 'warehouse_id' });

    if (error) {
        logError(error, { operation: 'updateSubscriptionAdmin', metadata: { warehouseId, planId, status } });
        return { success: false, message: error.message };
    }

    revalidatePath('/admin');
    return { success: true, message: 'Subscription updated successfully' };
}

// --- Subscription Expiry Handling ---

/**
 * Process expired subscriptions (called by cron/edge function)
 * Transitions: active -> grace_period -> expired -> downgrade to Free
 */
export async function processExpiredSubscriptions(): Promise<{
  success: boolean;
  processed: number;
  gracePeriod: number;
  expired: number;
  downgraded: number;
  errors: string[];
}> {
  const { createAdminClient } = await import('@/utils/supabase/admin');
  const adminSupabase = createAdminClient();
  
  try {
    // Call the DB function to process expiries
    const { data, error } = await adminSupabase.rpc('auto_expire_subscriptions');
    
    if (error) {
      logError(error, { operation: 'processExpiredSubscriptions' });
      return { 
        success: false, 
        processed: 0, 
        gracePeriod: 0,
        expired: 0,
        downgraded: 0,
        errors: [error.message] 
      };
    }

    const result = Array.isArray(data) ? data[0] : data;
    const { processed_count, grace_period_count, expired_count, downgraded_count } = result || {};
    
    // Send notifications for subscriptions in grace period or newly expired
    await sendExpiryNotifications();
    
    return { 
      success: true,
      processed: processed_count || 0,
      gracePeriod: grace_period_count || 0,
      expired: expired_count || 0,
      downgraded: downgraded_count || 0,
      errors: []
    };
  } catch (error: any) {
    logError(error, { operation: 'processExpiredSubscriptions' });
    return { 
      success: false, 
      processed: 0, 
      gracePeriod: 0,
      expired: 0,
      downgraded: 0,
      errors: [error.message] 
    };
  }
}

/**
 * Send expiry notifications for subscriptions in grace period or expired
 */
async function sendExpiryNotifications(): Promise<void> {
  const { createAdminClient } = await import('@/utils/supabase/admin');
  const adminSupabase = createAdminClient();
  
  try {
    // Fetch subscriptions in grace period that haven't been notified
    const { data: gracePeriodSubs } = await adminSupabase
      .from('subscriptions')
      .select(`
        id,
        warehouse_id,
        current_period_end,
        grace_period_end,
        warehouses!inner (
          name,
          email
        )
      `)
      .eq('status', 'grace_period')
      .eq('grace_period_notified', false);
    
    // Send grace period notifications
    for (const sub of gracePeriodSubs || []) {
      const warehouse = Array.isArray(sub.warehouses) ? sub.warehouses[0] : sub.warehouses;
      const daysLeft = Math.ceil(
        (new Date(sub.grace_period_end).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      );
      
      await adminSupabase.from('notifications').insert({
        warehouse_id: sub.warehouse_id,
        title: '⚠️ Subscription in Grace Period',
        message: `Your subscription expired on ${new Date(sub.current_period_end).toLocaleDateString()}. You have ${daysLeft} day${daysLeft !== 1 ? 's' : ''} remaining to renew before your account is downgraded to the Free plan.`,
        type: 'warning',
        category: 'subscription'
      });
      
      // Mark as notified
      await adminSupabase
        .from('subscriptions')
        .update({ grace_period_notified: true })
        .eq('id', sub.id);
    }
    
    // Fetch newly expired subscriptions (just downgraded to Free)
    const { data: expiredSubs } = await adminSupabase
      .from('subscriptions')
      .select(`
        id,
        warehouse_id,
        warehouses!inner (
          name,
          email
        ),
        plans!inner (
          name,
          tier
        )
      `)
      .eq('plans.tier', 'free')
      .gte('updated_at', new Date(Date.now() - 5 * 60 * 1000).toISOString()); // Last 5 minutes
    
    // Send downgrade notifications
    for (const sub of expiredSubs || []) {
      await adminSupabase.from('notifications').insert({
        warehouse_id: sub.warehouse_id,
        title: '📉 Subscription Downgraded',
        message: 'Your subscription has expired and been downgraded to the Free plan. Upgrade now to restore full access to premium features.',
        type: 'error',
        category: 'subscription'
      });
    }
  } catch (error: any) {
    logError(error, { operation: 'sendExpiryNotifications' });
  }
}

/**
 * Check upcoming expiries and send proactive warnings
 * Should be called daily by cron job
 */
export async function sendExpiryWarnings(): Promise<{
  success: boolean;
  warningsSent: number;
  errors: string[];
}> {
  const { createAdminClient } = await import('@/utils/supabase/admin');
  const adminSupabase = createAdminClient();
  
  try {
    const warningDays = [7, 3, 1]; // Days before expiry to send warnings
    let totalWarnings = 0;
    
    for (const days of warningDays) {
      const { data: expiring, error } = await adminSupabase.rpc(
        'get_expiring_subscriptions',
        { days_ahead: days }
      );
      
      if (error) {
        logError(error, { operation: 'sendExpiryWarnings', metadata: { days } });
        continue;
      }
      
      for (const sub of expiring || []) {
        await adminSupabase.from('notifications').insert({
          warehouse_id: sub.warehouse_id,
          title: `⏰ Subscription Expiring in ${days} Day${days > 1 ? 's' : ''}`,
          message: `Your subscription will expire on ${new Date(sub.current_period_end).toLocaleDateString()}. Renew now to avoid service interruption and maintain access to all features.`,
          type: 'warning',
          category: 'subscription'
        });
        totalWarnings++;
      }
    }
    
    return { success: true, warningsSent: totalWarnings, errors: [] };
  } catch (error: any) {
    logError(error, { operation: 'sendExpiryWarnings' });
    return { success: false, warningsSent: 0, errors: [error.message] };
  }
}

/**
 * Manual trigger for admins to process expiries (for testing/emergency)
 */
export async function manualProcessExpiries(): Promise<SubscriptionState> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  // Auth check
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user?.id).single();
  if (!profile || profile.role !== 'super_admin') {
    return { success: false, message: 'Unauthorized: Only super admins can manually process expiries' };
  }
  
  const result = await processExpiredSubscriptions();
  
  if (!result.success) {
    return { success: false, message: result.errors.join(', ') };
  }
  
  return { 
    success: true, 
    message: `Processed ${result.processed} subscriptions: ${result.gracePeriod} moved to grace period, ${result.expired} expired, ${result.downgraded} downgraded to Free.`,
    data: result
  };
}
