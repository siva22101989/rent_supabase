

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
        forUserId?: string,
        link?: string
    ) {
        return createNotification(title, message, type, forUserId, link);
    }
}

export async function logActivity(
    action: string,
    entity: string,
    entityId: string,
    details?: any
) {
    try {
        const supabase = await createClient();
        const warehouseId = await getUserWarehouse();
        const { data: { user } } = await supabase.auth.getUser();

        if (!warehouseId || !user) return;

        await supabase.from('activity_logs').insert({
            warehouse_id: warehouseId,
            user_id: user.id,
            action,
            entity,
            entity_id: entityId,
            details
        });
    } catch (error) {
        logError(error, { operation: 'log_activity', metadata: { action, entity, entityId } });
        // Don't block the main action loop
    }
}

export async function createNotification(
    title: string,
    message: string,
    type: 'info' | 'warning' | 'success' | 'error' = 'info',
    forUserId?: string, // If null, warehouse-wide
    link?: string
) {
    try {
        const supabase = await createClient();
        const warehouseId = await getUserWarehouse();
        
        if (!warehouseId) return;

        await supabase.from('notifications').insert({
            warehouse_id: warehouseId,
            user_id: forUserId || null,
            title,
            message,
            type,
            link
        });
    } catch (error) {
        logError(error, { operation: 'create_notification', metadata: { title, message } });
    }
}
