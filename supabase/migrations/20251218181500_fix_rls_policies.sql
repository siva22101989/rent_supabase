-- Fix RLS Policies
-- Enable RLS on all tables to be safe (idempotent)
ALTER TABLE storage_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- 1. Storage Records Policies
-- Allow managers to view/edit records for their warehouse
DROP POLICY IF EXISTS "Manager View Warehouse Records" ON storage_records;
CREATE POLICY "Manager View Warehouse Records" ON storage_records
    FOR ALL
    USING (warehouse_id IN (
        SELECT warehouse_id FROM profiles WHERE id = auth.uid()
    ));

-- 2. Payments Policies
-- Allow managers to view/edit payments for records in their warehouse
-- (Joining storage_records to check warehouse ownership)
DROP POLICY IF EXISTS "Manager Manage Payments" ON payments;
CREATE POLICY "Manager Manage Payments" ON payments
    FOR ALL
    USING (storage_record_id IN (
        SELECT id FROM storage_records 
        WHERE warehouse_id IN (
            SELECT warehouse_id FROM profiles WHERE id = auth.uid()
        )
    ));

-- 3. Expenses Policies
-- Allow managers to view/edit expenses for their warehouse
DROP POLICY IF EXISTS "Manager Manage Expenses" ON expenses;
CREATE POLICY "Manager Manage Expenses" ON expenses
    FOR ALL
    USING (warehouse_id IN (
        SELECT warehouse_id FROM profiles WHERE id = auth.uid()
    ));

-- 4. Notifications Policies
-- Allow users to view their own notifications
DROP POLICY IF EXISTS "User View Own Notifications" ON notifications;
CREATE POLICY "User View Own Notifications" ON notifications
    FOR SELECT
    USING (user_id = auth.uid());

-- Allow system (or anyone really, for now) to create notifications?
-- Usually created by server actions which use SERVICE_ROLE key (bypassing RLS).
-- But if created by client (rare), we might need an insert policy.
-- For now, SELECT is critical for the UI.
