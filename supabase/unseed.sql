-- ============================================================================
-- UNSEED SCRIPT: REMOVE SEED DATA
-- ============================================================================
-- This script removes only the data created by 'seed.sql'.
-- It targets the specific warehouse names used in the seed.
-- It executes a Bottom-Up deletion to respect 'ON DELETE RESTRICT' constraints.
-- ============================================================================

DO $$
DECLARE
    v_warehouse_names TEXT[] := ARRAY['AgroCold Junction', 'Valley Harvest Storage', 'Coastal Prime Warehouse'];
    v_name TEXT;
BEGIN
    RAISE NOTICE 'Starting Unseed Process...';

    FOREACH v_name IN ARRAY v_warehouse_names LOOP
        RAISE NOTICE 'Cleaning up warehouse: %', v_name;
        
        -- 1. Payments (Ref: storage_records)
        DELETE FROM public.payments 
        WHERE storage_record_id IN (
            SELECT id FROM public.storage_records 
            WHERE warehouse_id IN (SELECT id FROM public.warehouses WHERE name = v_name)
        );

        -- 2. Withdrawal Transactions (Ref: warehouse_id)
        DELETE FROM public.withdrawal_transactions 
        WHERE warehouse_id IN (SELECT id FROM public.warehouses WHERE name = v_name);

        -- 3. Unloading Records (Ref: warehouse_id)
        DELETE FROM public.unloading_records 
        WHERE warehouse_id IN (SELECT id FROM public.warehouses WHERE name = v_name);

        -- 4. Storage Records (Ref: warehouse_id)
        -- This must be deleted before Customers
        DELETE FROM public.storage_records 
        WHERE warehouse_id IN (SELECT id FROM public.warehouses WHERE name = v_name);

        -- 5. Customers (Ref: warehouse_id)
        DELETE FROM public.customers 
        WHERE warehouse_id IN (SELECT id FROM public.warehouses WHERE name = v_name);

        -- 6. Expenses (Ref: warehouse_id)
        DELETE FROM public.expenses 
        WHERE warehouse_id IN (SELECT id FROM public.warehouses WHERE name = v_name);

        -- 7. Notification & Activities (Optional cleanup if linked)
        DELETE FROM public.notifications 
        WHERE warehouse_id IN (SELECT id FROM public.warehouses WHERE name = v_name);
        
        DELETE FROM public.activity_logs 
        WHERE warehouse_id IN (SELECT id FROM public.warehouses WHERE name = v_name);

        -- 8. Warehouse Lots & Crops
        -- These might be set to NULL or CASCADE depending on schema, but explicit delete is cleaner
        DELETE FROM public.warehouse_lots 
        WHERE warehouse_id IN (SELECT id FROM public.warehouses WHERE name = v_name);
        
        DELETE FROM public.crops 
        WHERE warehouse_id IN (SELECT id FROM public.warehouses WHERE name = v_name);

        -- 9. Warehouse Settings (Ref: warehouse_id, CASCADE usually, but explicit is safe)
        DELETE FROM public.warehouse_settings 
        WHERE warehouse_id IN (SELECT id FROM public.warehouses WHERE name = v_name);

        -- 10. The Warehouse itself
        DELETE FROM public.warehouses WHERE name = v_name;
        
    END LOOP;

    RAISE NOTICE 'Unseed Complete. Seeded warehouses and related data have been removed.';
END $$;
