'use server';

import { checkAgingStock, checkWarehouseSpace, checkHighOutstanding, generateMonthlySummary } from '@/lib/services/smart-alerts';
import { createClient } from '@/utils/supabase/server';
import { logError } from '@/lib/error-logger';
import { revalidatePath } from 'next/cache';

/**
 * Server action to trigger daily alerts
 * Called by cron or manually
 */
export async function triggerDailyAlerts() {
  try {
    await checkAgingStock();
    await checkWarehouseSpace();
    
    return { success: true, message: 'Daily alerts checked' };
  } catch (error) {
    console.error('Error triggering daily alerts:', error);
    return { success: false, error: 'Failed to trigger daily alerts' };
  }
}

/**
 * Server action to trigger weekly payment check
 */
export async function triggerWeeklyPaymentCheck() {
  try {
    await checkHighOutstanding();
    
    return { success: true, message: 'Payment check completed' };
  } catch (error) {
    console.error('Error in payment check:', error);
    return { success: false, error: 'Failed to check payments' };
  }
}

/**
 * Server action to generate monthly summary
 */
export async function triggerMonthlySummary() {
  try {
    await generateMonthlySummary();
    
    return { success: true, message: 'Monthly summary generated' };
  } catch (error) {
    console.error('Error generating monthly summary:', error);
    return { success: false, error: 'Failed to generate summary' };
  }
}

/**
 * Manual trigger for space check (after inflow)
 */
export async function checkSpaceAfterInflow() {
  try {
    await checkWarehouseSpace();
    return { success: true };
  } catch (error) {
    console.error('Error checking space:', error);
    return { success: false };
  }
}

/**
 * Dismiss a notification
 */
export async function dismissNotificationAction(notificationId: string) {
  try {
    const supabase = await createClient();
    
    const { error } = await supabase
      .from('notifications')
      .update({ dismissed_at: new Date().toISOString() })
      .eq('id', notificationId);
    
    if (error) {
      logError(error, { operation: 'dismissNotificationAction' });
      return {
        success: false,
        error: 'Failed to dismiss notification'
      };
    }
    
    revalidatePath('/notifications');
    return {
      success: true,
      message: 'Notification dismissed successfully'
    };
  } catch (error) {
    logError(error as Error, { operation: 'dismissNotificationAction' });
    return {
      success: false,
      error: 'Failed to dismiss notification'
    };
  }
}
