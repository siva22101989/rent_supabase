-- Add Indexes for Performance Optimization
-- These tables are frequently filtered by warehouse_id for RLS policies and Dashboard queries

CREATE INDEX IF NOT EXISTS idx_customers_warehouse ON customers(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_expenses_warehouse ON expenses(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_crops_warehouse ON crops(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_warehouse_lots_warehouse ON warehouse_lots(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_notifications_warehouse ON notifications(warehouse_id);
