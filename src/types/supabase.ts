export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      activity_logs: {
        Row: {
          action: string
          created_at: string | null
          details: Json | null
          entity: string
          entity_id: string | null
          id: string
          user_id: string | null
          warehouse_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          details?: Json | null
          entity: string
          entity_id?: string | null
          id?: string
          user_id?: string | null
          warehouse_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          details?: Json | null
          entity?: string
          entity_id?: string | null
          id?: string
          user_id?: string | null
          warehouse_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "activity_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_logs_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      commodity_prices: {
        Row: {
          arrival_quantity: number | null
          commodity: string
          created_at: string | null
          district: string | null
          id: string
          market: string
          max_price: number | null
          min_price: number | null
          modal_price: number | null
          price_date: string
          state: string
          updated_at: string | null
          variety: string | null
        }
        Insert: {
          arrival_quantity?: number | null
          commodity: string
          created_at?: string | null
          district?: string | null
          id?: string
          market: string
          max_price?: number | null
          min_price?: number | null
          modal_price?: number | null
          price_date: string
          state: string
          updated_at?: string | null
          variety?: string | null
        }
        Update: {
          arrival_quantity?: number | null
          commodity?: string
          created_at?: string | null
          district?: string | null
          id?: string
          market?: string
          max_price?: number | null
          min_price?: number | null
          modal_price?: number | null
          price_date?: string
          state?: string
          updated_at?: string | null
          variety?: string | null
        }
        Relationships: []
      }
      crops: {
        Row: {
          created_at: string | null
          id: string
          name: string
          rent_price_1y: number | null
          rent_price_6m: number | null
          updated_at: string | null
          warehouse_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          rent_price_1y?: number | null
          rent_price_6m?: number | null
          updated_at?: string | null
          warehouse_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          rent_price_1y?: number | null
          rent_price_6m?: number | null
          updated_at?: string | null
          warehouse_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crops_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          address: string
          created_at: string | null
          deleted_at: string | null
          email: string | null
          father_name: string | null
          id: string
          linked_user_id: string | null
          name: string
          phone: string
          updated_at: string | null
          village: string | null
          warehouse_id: string | null
        }
        Insert: {
          address: string
          created_at?: string | null
          deleted_at?: string | null
          email?: string | null
          father_name?: string | null
          id?: string
          linked_user_id?: string | null
          name: string
          phone: string
          updated_at?: string | null
          village?: string | null
          warehouse_id?: string | null
        }
        Update: {
          address?: string
          created_at?: string | null
          deleted_at?: string | null
          email?: string | null
          father_name?: string | null
          id?: string
          linked_user_id?: string | null
          name?: string
          phone?: string
          updated_at?: string | null
          village?: string | null
          warehouse_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customers_linked_user_id_fkey"
            columns: ["linked_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customers_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      expenses: {
        Row: {
          amount: number
          category: string | null
          created_at: string | null
          deleted_at: string | null
          description: string
          expense_date: string | null
          id: string
          updated_at: string | null
          warehouse_id: string | null
        }
        Insert: {
          amount: number
          category?: string | null
          created_at?: string | null
          deleted_at?: string | null
          description: string
          expense_date?: string | null
          id?: string
          updated_at?: string | null
          warehouse_id?: string | null
        }
        Update: {
          amount?: number
          category?: string | null
          created_at?: string | null
          deleted_at?: string | null
          description?: string
          expense_date?: string | null
          id?: string
          updated_at?: string | null
          warehouse_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "expenses_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_reads: {
        Row: {
          notification_id: string
          read_at: string | null
          user_id: string
        }
        Insert: {
          notification_id: string
          read_at?: string | null
          user_id: string
        }
        Update: {
          notification_id?: string
          read_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_reads_notification_id_fkey"
            columns: ["notification_id"]
            isOneToOne: false
            referencedRelation: "notifications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notification_reads_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string | null
          id: string
          is_read: boolean | null
          link: string | null
          message: string
          title: string
          type: string | null
          user_id: string | null
          warehouse_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          link?: string | null
          message: string
          title: string
          type?: string | null
          user_id?: string | null
          warehouse_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          link?: string | null
          message?: string
          title?: string
          type?: string | null
          user_id?: string | null
          warehouse_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          created_at: string | null
          deleted_at: string | null
          id: string
          notes: string | null
          payment_date: string | null
          payment_number: number
          storage_record_id: string | null
          type: string | null
          updated_at: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          deleted_at?: string | null
          id?: string
          notes?: string | null
          payment_date?: string | null
          payment_number?: number
          storage_record_id?: string | null
          type?: string | null
          updated_at?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          deleted_at?: string | null
          id?: string
          notes?: string | null
          payment_date?: string | null
          payment_number?: number
          storage_record_id?: string | null
          type?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_storage_record_id_fkey"
            columns: ["storage_record_id"]
            isOneToOne: false
            referencedRelation: "storage_records"
            referencedColumns: ["id"]
          },
        ]
      }
      plans: {
        Row: {
          created_at: string | null
          description: string | null
          display_name: string
          features: Json | null
          id: string
          is_active: boolean | null
          max_storage_records: number | null
          max_users: number | null
          max_warehouses: number
          name: string
          price_monthly: number
          price_yearly: number | null
          razorpay_plan_id: string | null
          tier: string
          trial_period_days: number | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          display_name: string
          features?: Json | null
          id?: string
          is_active?: boolean | null
          max_storage_records?: number | null
          max_users?: number | null
          max_warehouses?: number
          name: string
          price_monthly: number
          price_yearly?: number | null
          razorpay_plan_id?: string | null
          tier: string
          trial_period_days?: number | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          display_name?: string
          features?: Json | null
          id?: string
          is_active?: boolean | null
          max_storage_records?: number | null
          max_users?: number | null
          max_warehouses?: number
          name?: string
          price_monthly?: number
          price_yearly?: number | null
          razorpay_plan_id?: string | null
          tier?: string
          trial_period_days?: number | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string | null
          email: string | null
          full_name: string | null
          id: string
          role: Database["public"]["Enums"]["user_roles"] | null
          warehouse_id: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          role?: Database["public"]["Enums"]["user_roles"] | null
          warehouse_id?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          role?: Database["public"]["Enums"]["user_roles"] | null
          warehouse_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      razorpay_webhook_events: {
        Row: {
          created_at: string | null
          error_message: string | null
          event_id: string
          event_type: string
          id: string
          payload: Json | null
          processed: boolean | null
          processed_at: string | null
        }
        Insert: {
          created_at?: string | null
          error_message?: string | null
          event_id: string
          event_type: string
          id?: string
          payload?: Json | null
          processed?: boolean | null
          processed_at?: string | null
        }
        Update: {
          created_at?: string | null
          error_message?: string | null
          event_id?: string
          event_type?: string
          id?: string
          payload?: Json | null
          processed?: boolean | null
          processed_at?: string | null
        }
        Relationships: []
      }
      sequences: {
        Row: {
          current_value: number | null
          last_reset: string | null
          type: string
          warehouse_id: string
        }
        Insert: {
          current_value?: number | null
          last_reset?: string | null
          type: string
          warehouse_id: string
        }
        Update: {
          current_value?: number | null
          last_reset?: string | null
          type?: string
          warehouse_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sequences_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      sms_settings: {
        Row: {
          created_at: string | null
          enabled: boolean | null
          event_type: string
          id: string
          updated_at: string | null
          warehouse_id: string
        }
        Insert: {
          created_at?: string | null
          enabled?: boolean | null
          event_type: string
          id?: string
          updated_at?: string | null
          warehouse_id: string
        }
        Update: {
          created_at?: string | null
          enabled?: boolean | null
          event_type?: string
          id?: string
          updated_at?: string | null
          warehouse_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sms_settings_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_movements: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: string
          lot_id: string | null
          movement_type: string
          new_lot_stock: number | null
          previous_lot_stock: number | null
          quantity: number
          reason: string | null
          storage_record_id: string | null
          warehouse_id: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          lot_id?: string | null
          movement_type: string
          new_lot_stock?: number | null
          previous_lot_stock?: number | null
          quantity: number
          reason?: string | null
          storage_record_id?: string | null
          warehouse_id: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          lot_id?: string | null
          movement_type?: string
          new_lot_stock?: number | null
          previous_lot_stock?: number | null
          quantity?: number
          reason?: string | null
          storage_record_id?: string | null
          warehouse_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "stock_movements_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      storage_records: {
        Row: {
          bags_in: number | null
          bags_out: number | null
          bags_stored: number | null
          billing_cycle: string | null
          commodity_description: string | null
          created_at: string | null
          crop_id: string | null
          customer_id: string | null
          deleted_at: string | null
          hamali_payable: number | null
          id: string
          inflow_type: string | null
          khata_amount: number | null
          load_bags: number | null
          location: string | null
          lorry_tractor_no: string | null
          lot_id: string | null
          outflow_invoice_no: string | null
          plot_bags: number | null
          record_number: number
          storage_end_date: string | null
          storage_start_date: string | null
          total_rent_billed: number | null
          updated_at: string | null
          warehouse_id: string | null
        }
        Insert: {
          bags_in?: number | null
          bags_out?: number | null
          bags_stored?: number | null
          billing_cycle?: string | null
          commodity_description?: string | null
          created_at?: string | null
          crop_id?: string | null
          customer_id?: string | null
          deleted_at?: string | null
          hamali_payable?: number | null
          id?: string
          inflow_type?: string | null
          khata_amount?: number | null
          load_bags?: number | null
          location?: string | null
          lorry_tractor_no?: string | null
          lot_id?: string | null
          outflow_invoice_no?: string | null
          plot_bags?: number | null
          record_number?: number
          storage_end_date?: string | null
          storage_start_date?: string | null
          total_rent_billed?: number | null
          updated_at?: string | null
          warehouse_id?: string | null
        }
        Update: {
          bags_in?: number | null
          bags_out?: number | null
          bags_stored?: number | null
          billing_cycle?: string | null
          commodity_description?: string | null
          created_at?: string | null
          crop_id?: string | null
          customer_id?: string | null
          deleted_at?: string | null
          hamali_payable?: number | null
          id?: string
          inflow_type?: string | null
          khata_amount?: number | null
          load_bags?: number | null
          location?: string | null
          lorry_tractor_no?: string | null
          lot_id?: string | null
          outflow_invoice_no?: string | null
          plot_bags?: number | null
          record_number?: number
          storage_end_date?: string | null
          storage_start_date?: string | null
          total_rent_billed?: number | null
          updated_at?: string | null
          warehouse_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "storage_records_crop_id_fkey"
            columns: ["crop_id"]
            isOneToOne: false
            referencedRelation: "crops"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "storage_records_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "storage_records_lot_id_fkey"
            columns: ["lot_id"]
            isOneToOne: false
            referencedRelation: "warehouse_lots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "storage_records_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_codes: {
        Row: {
          code: string
          created_at: string | null
          created_by: string | null
          duration_days: number
          id: string
          notes: string | null
          plan_id: string
          status: string | null
          used_at: string | null
          used_by_warehouse_id: string | null
        }
        Insert: {
          code: string
          created_at?: string | null
          created_by?: string | null
          duration_days?: number
          id?: string
          notes?: string | null
          plan_id: string
          status?: string | null
          used_at?: string | null
          used_by_warehouse_id?: string | null
        }
        Update: {
          code?: string
          created_at?: string | null
          created_by?: string | null
          duration_days?: number
          id?: string
          notes?: string | null
          plan_id?: string
          status?: string | null
          used_at?: string | null
          used_by_warehouse_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "subscription_codes_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscription_codes_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscription_codes_used_by_warehouse_id_fkey"
            columns: ["used_by_warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_payments: {
        Row: {
          amount: number
          created_at: string | null
          currency: string | null
          failure_reason: string | null
          id: string
          invoice_url: string | null
          payment_method: string | null
          razorpay_invoice_id: string | null
          razorpay_order_id: string | null
          razorpay_payment_id: string | null
          status: string | null
          subscription_id: string | null
          updated_at: string | null
          warehouse_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          currency?: string | null
          failure_reason?: string | null
          id?: string
          invoice_url?: string | null
          payment_method?: string | null
          razorpay_invoice_id?: string | null
          razorpay_order_id?: string | null
          razorpay_payment_id?: string | null
          status?: string | null
          subscription_id?: string | null
          updated_at?: string | null
          warehouse_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          currency?: string | null
          failure_reason?: string | null
          id?: string
          invoice_url?: string | null
          payment_method?: string | null
          razorpay_invoice_id?: string | null
          razorpay_order_id?: string | null
          razorpay_payment_id?: string | null
          status?: string | null
          subscription_id?: string | null
          updated_at?: string | null
          warehouse_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "subscription_payments_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscription_payments_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          cancel_at_period_end: boolean | null
          canceled_at: string | null
          created_at: string | null
          current_period_end: string | null
          current_period_start: string | null
          id: string
          plan_id: string | null
          razorpay_customer_id: string | null
          razorpay_subscription_id: string | null
          status: string | null
          trial_end_date: string | null
          trial_start_date: string | null
          updated_at: string | null
          warehouse_id: string | null
        }
        Insert: {
          cancel_at_period_end?: boolean | null
          canceled_at?: string | null
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          plan_id?: string | null
          razorpay_customer_id?: string | null
          razorpay_subscription_id?: string | null
          status?: string | null
          trial_end_date?: string | null
          trial_start_date?: string | null
          updated_at?: string | null
          warehouse_id?: string | null
        }
        Update: {
          cancel_at_period_end?: boolean | null
          canceled_at?: string | null
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          plan_id?: string | null
          razorpay_customer_id?: string | null
          razorpay_subscription_id?: string | null
          status?: string | null
          trial_end_date?: string | null
          trial_start_date?: string | null
          updated_at?: string | null
          warehouse_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: true
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      user_commodity_watchlist: {
        Row: {
          alert_enabled: boolean | null
          alert_threshold: number | null
          commodity: string
          created_at: string | null
          id: string
          preferred_market: string | null
          preferred_state: string | null
          updated_at: string | null
          user_id: string
          variety: string | null
          warehouse_id: string
        }
        Insert: {
          alert_enabled?: boolean | null
          alert_threshold?: number | null
          commodity: string
          created_at?: string | null
          id?: string
          preferred_market?: string | null
          preferred_state?: string | null
          updated_at?: string | null
          user_id: string
          variety?: string | null
          warehouse_id: string
        }
        Update: {
          alert_enabled?: boolean | null
          alert_threshold?: number | null
          commodity?: string
          created_at?: string | null
          id?: string
          preferred_market?: string | null
          preferred_state?: string | null
          updated_at?: string | null
          user_id?: string
          variety?: string | null
          warehouse_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_commodity_watchlist_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_commodity_watchlist_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      user_warehouses: {
        Row: {
          created_at: string | null
          id: string
          role: string | null
          user_id: string
          warehouse_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role?: string | null
          user_id: string
          warehouse_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: string | null
          user_id?: string
          warehouse_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_warehouses_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_warehouses_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      warehouse_assignments: {
        Row: {
          created_at: string | null
          id: string
          role: string | null
          updated_at: string | null
          user_id: string | null
          warehouse_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          role?: string | null
          updated_at?: string | null
          user_id?: string | null
          warehouse_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: string | null
          updated_at?: string | null
          user_id?: string | null
          warehouse_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "warehouse_assignments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "warehouse_assignments_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      warehouse_invitations: {
        Row: {
          claimed_by: string | null
          created_at: string | null
          created_by: string | null
          id: string
          role: string | null
          status: string | null
          token: string
          updated_at: string | null
          warehouse_id: string | null
        }
        Insert: {
          claimed_by?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          role?: string | null
          status?: string | null
          token?: string
          updated_at?: string | null
          warehouse_id?: string | null
        }
        Update: {
          claimed_by?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          role?: string | null
          status?: string | null
          token?: string
          updated_at?: string | null
          warehouse_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "warehouse_invitations_claimed_by_fkey"
            columns: ["claimed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "warehouse_invitations_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "warehouse_invitations_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      warehouse_lots: {
        Row: {
          capacity: number | null
          created_at: string | null
          current_stock: number | null
          id: string
          name: string
          status: string | null
          updated_at: string | null
          warehouse_id: string
        }
        Insert: {
          capacity?: number | null
          created_at?: string | null
          current_stock?: number | null
          id?: string
          name: string
          status?: string | null
          updated_at?: string | null
          warehouse_id: string
        }
        Update: {
          capacity?: number | null
          created_at?: string | null
          current_stock?: number | null
          id?: string
          name?: string
          status?: string | null
          updated_at?: string | null
          warehouse_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "warehouse_lots_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      warehouses: {
        Row: {
          capacity_bags: number | null
          created_at: string | null
          email: string | null
          id: string
          location: string | null
          name: string
          phone: string | null
        }
        Insert: {
          capacity_bags?: number | null
          created_at?: string | null
          email?: string | null
          id?: string
          location?: string | null
          name: string
          phone?: string | null
        }
        Update: {
          capacity_bags?: number | null
          created_at?: string | null
          email?: string | null
          id?: string
          location?: string | null
          name?: string
          phone?: string | null
        }
        Relationships: []
      }
      withdrawal_transactions: {
        Row: {
          bags_withdrawn: number
          created_at: string | null
          deleted_at: string | null
          id: string
          rent_collected: number | null
          storage_record_id: string
          updated_at: string | null
          warehouse_id: string
          withdrawal_date: string
        }
        Insert: {
          bags_withdrawn: number
          created_at?: string | null
          deleted_at?: string | null
          id?: string
          rent_collected?: number | null
          storage_record_id: string
          updated_at?: string | null
          warehouse_id: string
          withdrawal_date: string
        }
        Update: {
          bags_withdrawn?: number
          created_at?: string | null
          deleted_at?: string | null
          id?: string
          rent_collected?: number | null
          storage_record_id?: string
          updated_at?: string | null
          warehouse_id?: string
          withdrawal_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "withdrawal_transactions_storage_record_id_fkey"
            columns: ["storage_record_id"]
            isOneToOne: false
            referencedRelation: "storage_records"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "withdrawal_transactions_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      customer_balances: {
        Row: {
          active_records_count: number | null
          balance: number | null
          customer_id: string | null
          customer_name: string | null
          email: string | null
          phone: string | null
          total_billed: number | null
          total_paid: number | null
          village: string | null
          warehouse_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customers_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      generate_invoice_number: {
        Args: {
          p_warehouse_id: string
          p_type: string
        }
        Returns: string
      }
      log_stock_movement: {
        Args: Record<PropertyKey, never>
        Returns: unknown
      }
      refresh_customer_balances: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      sync_user_role: {
        Args: Record<PropertyKey, never>
        Returns: unknown
      }
      trigger_refresh_customer_balances: {
        Args: Record<PropertyKey, never>
        Returns: unknown
      }
    }
    Enums: {
      billing_cycle: "6m" | "1y"
      inflow_type: "purchase" | "transfer_in" | "return" | "other"
      lot_status: "active" | "inactive" | "maintenance" | "full"
      movement_type: "in" | "out" | "adjustment" | "void" | "transfer"
      payment_type: "rent" | "hamali" | "advance" | "security_deposit" | "other"
      user_roles: "admin" | "manager" | "staff" | "super_admin" | "owner" | "customer"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type Enums<T extends keyof Database['public']['Enums']> = Database['public']['Enums'][T]


export const Constants = {
  public: {
    Enums: {
      billing_cycle: ["6m", "1y"],
      inflow_type: ["purchase", "transfer_in", "return", "other"],
      lot_status: ["active", "inactive", "maintenance", "full"],
      movement_type: ["in", "out", "adjustment", "void", "transfer"],
      payment_type: ["rent", "hamali", "advance", "security_deposit", "other"],
      user_roles: [
        "admin",
        "manager",
        "staff",
        "super_admin",
        "owner",
        "customer",
      ],
    },
  },
} as const
