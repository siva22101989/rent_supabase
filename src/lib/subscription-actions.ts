'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';
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
  // Use service directly since this is a read operation often used by components
  // But for an action we must ensure auth if it's exposed to client
  // Since this is just a wrapper, we can check auth.
  const { getSubscriptionWithUsage } = await import('@/services/subscription-service');
  // Simple auth check wrapper inline or just trust the service? Service doesn't check auth.
  // Let's use authenticatedAction for consistency if this is called from client.
  // Actually, this function seems to be used as a server action.
  
  // NOTE: authenticatedAction signature requires (user, supabase).
  // We need to return the data.
  // But this function return type was specific.
  
  // Let's keep it simple for now and just delegate to service, but adding basic auth check to match previous behavior
  const supabase = createClient();
  const { data: { user } } = await (await supabase).auth.getUser();
  if (!user) return null;
  
  const { subscription, usage } = await getSubscriptionWithUsage(warehouseId);
  
  if (!subscription) {
      // Return Free Tier structure with actual usage
      return {
          status: 'active',
          warehouse_id: warehouseId,
          plans: {
             name: 'free',
             display_name: 'Free',
             tier: 'free',
             max_warehouses: 1,
             max_storage_records: 50,
             features: {}
          },
          usage
      } as any; // Cast to satisfy legacy return type expected by Context
  }

  return {
      ...subscription,
      usage
  };
}

import { authenticatedAction } from './safe-action';
import { SubscriptionStatus, UserRole } from '@/types/db';

export async function startSubscriptionAction(
  warehouseId: string,
  planTier: string
): Promise<SubscriptionState> {
  return authenticatedAction('startSubscriptionAction', async (_user, supabase, _userRole) => {
      // 1. Get the plan details
      const { data: plan, error: planError } = await supabase
        .from('plans')
        .select('*')
        .eq('tier', planTier)
        .single();

      if (planError || !plan) {
        return { success: false, message: "Invalid plan selected." };
      }

      // Create an 'incomplete' subscription
      const { error: subError } = await supabase
        .from('subscriptions')
        .upsert({
          warehouse_id: warehouseId,
          plan_id: plan.id,
          status: SubscriptionStatus.INCOMPLETE, // Signal for admin approval/payment
          updated_at: new Date().toISOString()
        }, { onConflict: 'warehouse_id' });
      
      if (subError) throw subError;

      return { 
        success: true, 
        message: "Request logged. Please contact the Super Admin to activate this plan.", 
      };
  });
}

// --- Admin Actions ---

export async function getAdminAllSubscriptions() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    // Auth Check
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user?.id).single();
    if (!profile || (profile.role !== UserRole.SUPER_ADMIN && profile.role !== UserRole.OWNER)) {
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
    status: SubscriptionStatus,
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
    if (status === SubscriptionStatus.ACTIVE && endDate) {
        const endDateTime = new Date(endDate).getTime();
        const now = Date.now();
        
        if (endDateTime > now) {
            // Future date = renewal, clear grace period
            updateData.grace_period_end = null;
            updateData.grace_period_notified = false;
        }
    }
    
    // SAFEGUARD 2: If admin explicitly sets status to 'grace_period', calculate grace_period_end
    if (status === SubscriptionStatus.GRACE_PERIOD && endDate) {
        const graceDays = 7;
        const endDateTime = new Date(endDate).getTime();
        updateData.grace_period_end = new Date(endDateTime + graceDays * 24 * 60 * 60 * 1000).toISOString();
        updateData.grace_period_notified = false;
    }
    
    // SAFEGUARD 3: If changing from grace_period to any other active status, clear grace period
    if (status !== SubscriptionStatus.GRACE_PERIOD && status !== SubscriptionStatus.EXPIRED) {
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
      .eq('status', SubscriptionStatus.GRACE_PERIOD)
      .eq('grace_period_notified', false);
    
    // Send grace period notifications
    for (const sub of gracePeriodSubs || []) {
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
  if (!profile || profile.role !== UserRole.SUPER_ADMIN) {
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
