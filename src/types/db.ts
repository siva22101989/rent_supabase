import { PlanTier } from '@/lib/feature-flags';

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      warehouses: {
        Row: {
          id: string
          name: string
          location: string | null
          capacity: number
          gst_number: string | null
          created_at: string
          updated_at: string
          deleted_at: string | null
        }
        Insert: {
          id?: string
          name: string
          location?: string | null
          capacity?: number
          gst_number?: string | null
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          location?: string | null
          capacity?: number
          gst_number?: string | null
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
      }
      profiles: {
        Row: {
          id: string
          email: string
          warehouse_id: string | null
          role: UserRole
          created_at: string
        }
        Insert: {
          id: string
          email: string
          warehouse_id?: string | null
          role?: UserRole
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          warehouse_id?: string | null
          role?: UserRole
          created_at?: string
        }
      }
      subscriptions: {
        Row: {
          id: string
          warehouse_id: string
          plan_id: string
          status: SubscriptionStatus
          current_period_end: string | null
          trial_start_date: string | null
          trial_end_date: string | null
          grace_period_end: string | null
          grace_period_notified: boolean
          updated_at: string
        }
        Insert: {
          id?: string
          warehouse_id: string
          plan_id: string
          status: SubscriptionStatus
          current_period_end?: string | null
          trial_start_date?: string | null
          trial_end_date?: string | null
          grace_period_end?: string | null
          grace_period_notified?: boolean
          updated_at?: string
        }
        Update: {
          id?: string
          warehouse_id?: string
          plan_id?: string
          status?: SubscriptionStatus
          current_period_end?: string | null
          trial_start_date?: string | null
          trial_end_date?: string | null
          grace_period_end?: string | null
          grace_period_notified?: boolean
          updated_at?: string
        }
      }
      storage_records: {
        Row: {
          id: string
          record_number: string
          warehouse_id: string
          created_at: string
          deleted_at: string | null
          // ... add other fields as discovered
        }
        Insert: {
           // ...
        }
        Update: {
           // ...
        }
      }
      plans: {
        Row: {
          id: string
          name: string
          display_name: string
          tier: PlanTier
          max_warehouses: number
          max_storage_records: number | null
          features: Json
          created_at: string
        }
      }
      warehouse_assignments: {
        Row: {
          id: string
          user_id: string
          warehouse_id: string
          role: UserRole
          created_at: string
          deleted_at: string | null
        }
      }
      audit_logs: {
        Row: {
          id: string
          warehouse_id: string
          user_id: string
          action: AuditAction
          entity: AuditEntity
          entity_id: string
          details: Json
          ip_address: string
          created_at: string
        }
        Insert: {
          warehouse_id: string
          user_id: string
          action: AuditAction
          entity: AuditEntity
          entity_id: string
          details?: Json
          ip_address?: string
        }
        Update: {
           // immutable
        }
      }
    }
    Enums: {
       user_role: UserRole
    }
  }
}

export enum UserRole {
  OWNER = 'owner',
  ADMIN = 'admin',
  MANAGER = 'manager',
  STAFF = 'staff',
  SUPER_ADMIN = 'super_admin'
}

export enum SubscriptionStatus {
  ACTIVE = 'active',
  INCOMPLETE = 'incomplete',
  PAST_DUE = 'past_due',
  CANCELED = 'canceled',
  UNPAID = 'unpaid',
  TRIALING = 'trialing',
  GRACE_PERIOD = 'grace_period',
  EXPIRED = 'expired',
  TRAILING_TRIAL = 'trailing_trial'
}

export enum AuditAction {
    CREATE = 'CREATE',
    UPDATE = 'UPDATE',
    DELETE = 'DELETE',
    LOGIN = 'LOGIN',
    LOGOUT = 'LOGOUT',
    EXPORT = 'EXPORT',
    BULK_ACTION = 'BULK_ACTION'
}

export enum AuditEntity {
    STORAGE_RECORD = 'STORAGE_RECORD',
    CUSTOMER = 'CUSTOMER',
    PAYMENT = 'PAYMENT',
    INFLOW = 'INFLOW',
    OUTFLOW = 'OUTFLOW',
    USER = 'USER',
    SETTINGS = 'SETTINGS',
    SUBSCRIPTION = 'SUBSCRIPTION'
}
