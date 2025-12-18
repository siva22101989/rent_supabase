-- Add phone and email columns to warehouses table
ALTER TABLE warehouses 
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS email TEXT;
