-- Final Database Polish

-- 1. Create Auto-Update Function for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 2. Add updated_at columns and triggers to key tables

-- Customers
ALTER TABLE customers ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();
DROP TRIGGER IF EXISTS trg_customers_updated_at ON customers;
CREATE TRIGGER trg_customers_updated_at BEFORE UPDATE ON customers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Storage Records
ALTER TABLE storage_records ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();
DROP TRIGGER IF EXISTS trg_storage_records_updated_at ON storage_records;
CREATE TRIGGER trg_storage_records_updated_at BEFORE UPDATE ON storage_records FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Payments
ALTER TABLE payments ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();
DROP TRIGGER IF EXISTS trg_payments_updated_at ON payments;
CREATE TRIGGER trg_payments_updated_at BEFORE UPDATE ON payments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Expenses
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();
DROP TRIGGER IF EXISTS trg_expenses_updated_at ON expenses;
CREATE TRIGGER trg_expenses_updated_at BEFORE UPDATE ON expenses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Warehouse Lots
ALTER TABLE warehouse_lots ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();
DROP TRIGGER IF EXISTS trg_warehouse_lots_updated_at ON warehouse_lots;
CREATE TRIGGER trg_warehouse_lots_updated_at BEFORE UPDATE ON warehouse_lots FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Crops
ALTER TABLE crops ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();
DROP TRIGGER IF EXISTS trg_crops_updated_at ON crops;
CREATE TRIGGER trg_crops_updated_at BEFORE UPDATE ON crops FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- 3. Add Data Integrity Constraints (Safety)

-- Storage Records: Non-negative stock and bags (allow 0)
ALTER TABLE storage_records ADD CONSTRAINT check_bags_stored_positive CHECK (bags_stored >= 0);
ALTER TABLE storage_records ADD CONSTRAINT check_bags_in_positive CHECK (bags_in >= 0);

-- Payments: Positive amount
ALTER TABLE payments ADD CONSTRAINT check_payment_amount_positive CHECK (amount > 0);

-- Expenses: Positive amount
ALTER TABLE expenses ADD CONSTRAINT check_expense_amount_positive CHECK (amount > 0);

-- Warehouse Lots: Non-negative stock
ALTER TABLE warehouse_lots ADD CONSTRAINT check_lot_stock_positive CHECK (current_stock >= 0);
