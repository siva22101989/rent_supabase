import { createClient } from '@/utils/supabase/server';
import { headers } from 'next/headers';
import { logError } from './error-logger';

export type AuditAction = 
    | 'CREATE'
    | 'UPDATE'
    | 'DELETE'
    | 'LOGIN'
    | 'LOGOUT'
    | 'EXPORT'
    | 'BULK_ACTION';

export type AuditEntity = 
    | 'STORAGE_RECORD'
    | 'CUSTOMER'
    | 'PAYMENT'
    | 'INFLOW'
    | 'OUTFLOW'
    | 'USER'
    | 'SETTINGS'
    | 'SUBSCRIPTION';

interface AuditLogParams {
    action: AuditAction;
    entity: AuditEntity;
    entityId: string;
    details?: Record<string, any>;
    warehouseId: string;
}

export async function logActivity({
    action,
    entity,
    entityId,
    details = {},
    warehouseId
}: AuditLogParams) {
    try {
        const supabase = await createClient();
        
        // Get IP address safely
        const heads = await headers();
        const ip = heads.get('x-forwarded-for') || heads.get('x-real-ip') || 'unknown';
        
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
            console.warn('Attempted to log activity without authenticated user');
            return;
        }

        const { error } = await supabase.from('audit_logs').insert({
            warehouse_id: warehouseId,
            user_id: user.id,
            action,
            entity,
            entity_id: entityId,
            details,
            ip_address: ip
        });

        if (error) {
            console.error('Failed to insert audit log:', error);
            // Don't throw, as auditing shouldn't block the main action
            logError(error, { 
                operation: 'logActivity', 
                metadata: { action, entity, warehouseId } 
            });
        }
    } catch (err) {
        console.error('Error in logActivity:', err);
        logError(err, { 
            operation: 'logActivity_Unknown', 
            metadata: { action, entity, warehouseId } 
        });
    }
}
