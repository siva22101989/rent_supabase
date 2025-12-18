-- Create sequences table
CREATE TABLE IF NOT EXISTS sequences (
    warehouse_id UUID NOT NULL REFERENCES warehouses(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('inflow', 'outflow')),
    current_value INTEGER DEFAULT 0,
    last_reset TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (warehouse_id, type)
);

-- Add outflow_invoice_no to storage_records
ALTER TABLE storage_records ADD COLUMN IF NOT EXISTS outflow_invoice_no TEXT;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_sequences_warehouse_type ON sequences(warehouse_id, type);

-- Function to increment sequence safely
CREATE OR REPLACE FUNCTION get_next_sequence_value(p_warehouse_id UUID, p_type TEXT)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_next_val INTEGER;
BEGIN
    INSERT INTO sequences (warehouse_id, type, current_value)
    VALUES (p_warehouse_id, p_type, 1)
    ON CONFLICT (warehouse_id, type)
    DO UPDATE SET current_value = sequences.current_value + 1
    RETURNING current_value INTO v_next_val;
    
    RETURN v_next_val;
END;
$$;
