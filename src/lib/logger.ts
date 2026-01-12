

import * as Sentry from '@sentry/nextjs';
import { createClient } from '@/utils/supabase/server';
import { getUserWarehouse } from '@/lib/queries';
import { logError, logWarning } from '@/lib/error-logger';

export class Logger {
    static info(message: string, context?: Record<string, any>) {
        if (process.env.NODE_ENV === 'development') {
            console.log(`[INFO] ${message}`, context);
        }
        Sentry.addBreadcrumb({
            category: 'log',
            message: message,
            level: 'info',
            data: context
        });
    }

    static warn(message: string, context?: any) {
        logWarning(message, context);
    }

    static error(error: unknown, context?: any) {
        logError(error, context);
    }

    static async audit(action: string, entity: string, entityId: string, details?: any) {
        return logActivity(action, entity, entityId, details);
    }

    static async notify(
        title: string,
        message: string,
        type: 'info' | 'warning' | 'success' | 'error' = 'info',
        category: NotificationCategory = 'system',
        forUserId?: string,
        link?: string
    ) {
        return createNotification(title, message, type, category, forUserId, link);
    }
}

export async function logActivity(
    action: string,
    entity: string,
    entityId: string,
    details?: any
) {
    try {
        const warehouseId = await getUserWarehouse();
        if (!warehouseId) return;

        // Redirect to new Audit Service
        const { logActivity: auditLog } = await import('@/lib/audit-service');
        await auditLog({
            action: action as any, // Cast or map if needed
            entity: entity as any,
            entityId,
            warehouseId,
            details
        });
    } catch (error) {
        logError(error, { operation: 'log_activity_redirect', metadata: { action, entity, entityId } });
    }
}

import { getNotificationPreferences } from '@/lib/notification-actions';
import type { NotificationCategory } from '@/lib/definitions';

export async function createNotification(
    title: string,
    message: string,
    type: 'info' | 'warning' | 'success' | 'error' = 'info',
    category: NotificationCategory = 'system',
    forUserId?: string, // If null, warehouse-wide
    link?: string
) {
    try {
        const supabase = await createClient();
        const warehouseId = await getUserWarehouse();
        
        if (!warehouseId) return;

        // If specific user, check their preferences
        if (forUserId) {
            const prefs = await getNotificationPreferences(warehouseId);
            // Note: getNotificationPreferences fetches for current auth user.
            // If forUserId != current user, we can't easily check their prefs without a new function or admin privs.
            // For now, let's skip preference check on creation if strictly enforcing requires extra queries.
            // BUT, if the sender IS the recipient (e.g. action done by user), we could check.
            // However, most notifications are "Payment Received" (created by cashier, for owner?).
            // Let's rely on READ-SIDE filtering for robust preference support.
        }

        await supabase.from('notifications').insert({
            warehouse_id: warehouseId,
            user_id: forUserId || null,
            title,
            message,
            type,
            category,
            link
        });
    } catch (error) {
        logError(error, { operation: 'create_notification', metadata: { title, message } });
    }
}
