-- Fix Missing Payment for Previous Inflow Record
-- This script adds the missing hamali payment that wasn't tracked due to the warehouse_id bug

-- First, let's identify the most recent inflow record with hamali_payable but no payment
-- You'll need to replace the values below with the actual record details

-- Example: If the record had:
-- - hamali_payable = 3000
-- - storage_start_date = today
-- - No existing payment in the payments table

-- Step 1: Find the record (run this first to get the record ID)
SELECT 
    sr.id,
    sr.record_number,
    sr.customer_id,
    sr.commodity_description,
    sr.hamali_payable,
    sr.storage_start_date,
    COUNT(p.id) as payment_count
FROM storage_records sr
LEFT JOIN payments p ON p.storage_record_id = sr.id AND p.type = 'hamali'
WHERE sr.hamali_payable > 0
  AND sr.storage_start_date >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY sr.id, sr.record_number, sr.customer_id, sr.commodity_description, sr.hamali_payable, sr.storage_start_date
HAVING COUNT(p.id) = 0
ORDER BY sr.storage_start_date DESC
LIMIT 5;

-- Step 2: Once you identify the record, insert the missing payment
-- REPLACE 'your-record-id-here' with the actual UUID from Step 1
-- REPLACE 3000 with the actual hamali amount
-- REPLACE '2025-12-20' with the actual storage start date

/*
INSERT INTO payments (storage_record_id, amount, payment_date, type, notes)
VALUES (
    'your-record-id-here',  -- Replace with actual record ID
    3000,                    -- Replace with actual hamali amount
    '2025-12-20',           -- Replace with actual payment date
    'hamali',
    'Payment added retroactively - was not tracked due to system bug'
);
*/

-- Step 3: Verify the payment was added
/*
SELECT 
    sr.record_number,
    sr.commodity_description,
    sr.hamali_payable,
    p.amount as payment_amount,
    p.payment_date,
    p.type
FROM storage_records sr
LEFT JOIN payments p ON p.storage_record_id = sr.id
WHERE sr.id = 'your-record-id-here';  -- Replace with actual record ID
*/
