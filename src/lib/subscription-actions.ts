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

  return data;
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
