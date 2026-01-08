-- ============================================================================
-- BagBill Full-Scale Seed Data
-- ============================================================================

DO $$
DECLARE
    v_warehouse_id UUID;
    v_crop_id UUID;
    v_lot_id UUID;
    v_customer_id UUID;
    v_record_id UUID;
    v_i INTEGER;
    v_j INTEGER;
    v_k INTEGER;
    v_l INTEGER;
    v_warehouse_names TEXT[] := ARRAY['AgroCold Junction', 'Valley Harvest Storage', 'Coastal Prime Warehouse'];
    v_crop_names TEXT[] := ARRAY['Potato - Jyoti', 'Onion - Red', 'Garlic - Premium', 'Ginger - Fresh'];
    v_customer_names TEXT[] := ARRAY[
        'Rajesh Kumar', 'Suresh Patel', 'Amit Sharma', 'Priyanka Devi', 'Anil Singh',
        'Meena Kumari', 'Vikas Reddy', 'Sunita Gupta', 'Deepak Verma', 'Kavita Singh',
        'Rohan Jaiswal', 'Manju Yadav', 'Rahul Mishra', 'Pooja Kapoor', 'Sanjay Dutt',
        'Vijay Iyer', 'Arun Joshi', 'Sneha Parikh', 'Manoj Tiwari', 'Rekha Sharma'
    ];
    v_bags_stored INTEGER;
    v_bags_withdrawn INTEGER;
    v_rent_billed NUMERIC;
    v_payment_amount NUMERIC;
BEGIN
    -- 1. Create Warehouses
    FOR v_i IN 1..3 LOOP
        INSERT INTO public.warehouses (name, location, capacity_bags, phone, email)
        VALUES (
            (v_warehouse_names)[v_i], 
            'Industrial Area Phase ' || v_i, 
            10000 * v_i, 
            '987654321' || v_i, 
            'contact@' || lower(replace((v_warehouse_names)[v_i], ' ', '')) || '.com'
        )
        RETURNING id INTO v_warehouse_id;

        -- 2. Create Crops for each Warehouse
        FOR v_j IN 1..4 LOOP
            INSERT INTO public.crops (warehouse_id, name, rent_price_6m, rent_price_1y)
            VALUES (v_warehouse_id, (v_crop_names)[v_j], 200 + (v_j * 20), 380 + (v_j * 35))
            RETURNING id INTO v_crop_id;
        END LOOP;

        -- 3. Create Lots for each Warehouse
        FOR v_k IN 1..5 LOOP
            INSERT INTO public.warehouse_lots (warehouse_id, name, capacity, status)
            VALUES (v_warehouse_id, 'Lot ' || v_k || '-' || v_i, 2000, 'Active')
            RETURNING id INTO v_lot_id;
        END LOOP;

        -- 4. Create Customers and Storage Records
        FOR v_l IN 1..20 LOOP
            v_customer_id := gen_random_uuid();
            INSERT INTO public.customers (id, name, phone, address, warehouse_id, father_name, village)
            VALUES (
                v_customer_id,
                (v_customer_names)[((v_l-1) % 20) + 1] || ' ' || (v_i * 10 + v_l),
                '90000' || (v_i * 1000 + v_l * 10),
                'Village No ' || (v_l + v_i * 5),
                v_warehouse_id,
                'Father of ' || (v_customer_names)[((v_l-1) % 20) + 1],
                'Green Valley'
            );

            -- 5. Create 3-8 Storage Records for each customer
            FOR v_record_count IN 1..(3 + floor(random() * 5))::INTEGER LOOP
                v_record_id := gen_random_uuid();
                v_bags_stored := 50 + floor(random() * 450);
                v_rent_billed := (v_bags_stored * 2); -- Dummy calculation

                -- Pick a random crop and lot from this warehouse
                SELECT id INTO v_crop_id FROM public.crops WHERE warehouse_id = v_warehouse_id ORDER BY random() LIMIT 1;
                SELECT id INTO v_lot_id FROM public.warehouse_lots WHERE warehouse_id = v_warehouse_id ORDER BY random() LIMIT 1;

                INSERT INTO public.storage_records (
                    id, customer_id, warehouse_id, crop_id, lot_id, 
                    bags_stored, bags_in, bags_out, 
                    inflow_type, lorry_tractor_no, 
                    storage_start_date, total_rent_billed, 
                    billing_cycle
                )
                VALUES (
                    v_record_id, v_customer_id, v_warehouse_id, v_crop_id, v_lot_id,
                    v_bags_stored, v_bags_stored, 0,
                    'Standard', 'UP-80-AB-' || (1000 + floor(random() * 8999)),
                    now() - (INTERVAL '1 day' * (30 + floor(random() * 180))),
                    v_rent_billed,
                    '6-Month Initial'
                );

                -- 6. Add some payments (70% chance)
                IF random() < 0.7 THEN
                    v_payment_amount := v_rent_billed * (0.3 + random() * 0.7);
                    INSERT INTO public.payments (storage_record_id, amount, type, payment_date, notes)
                    VALUES (v_record_id, v_payment_amount, 'rent', now() - (INTERVAL '1 day' * floor(random() * 20)), 'Partial rent payment');
                END IF;

                -- 7. Add some partial/full outflows (30% chance)
                IF random() < 0.3 THEN
                    v_bags_withdrawn := floor(v_bags_stored * (0.5 + random() * 0.5));
                    
                    INSERT INTO public.withdrawal_transactions (
                        warehouse_id, storage_record_id, bags_withdrawn, withdrawal_date, rent_collected
                    )
                    VALUES (
                        v_warehouse_id, v_record_id, v_bags_withdrawn, (now() - INTERVAL '5 days')::DATE, v_bags_withdrawn * 2.5
                    );

                    UPDATE public.storage_records 
                    SET bags_stored = bags_stored - v_bags_withdrawn,
                        bags_out = v_bags_withdrawn,
                        storage_end_date = CASE WHEN (bags_stored - v_bags_withdrawn) = 0 THEN now() ELSE NULL END
                    WHERE id = v_record_id;
                END IF;
            END LOOP;
        END LOOP;

        -- 8. Create some Expenses for each Warehouse
        FOR v_exp_count IN 1..15 LOOP
            INSERT INTO public.expenses (warehouse_id, description, amount, category, expense_date)
            VALUES (
                v_warehouse_id,
                'Maintenance / Utility Bill ' || v_exp_count,
                1000 + floor(random() * 5000),
                (ARRAY['electricity', 'labor', 'maintenance', 'office'])[(1 + floor(random() * 4))::INTEGER],
                now() - (INTERVAL '1 day' * floor(random() * 90))
            );
        END LOOP;
    END LOOP;

    -- 9. Setup Subscriptions for Warehouses (Efficient single statement)
    INSERT INTO public.subscriptions (warehouse_id, plan_id, status, current_period_start, current_period_end)
    SELECT w.id, p.id, 'active', now() - INTERVAL '1 month', now() + INTERVAL '11 months'
    FROM public.warehouses w
    CROSS JOIN public.plans p
    WHERE p.tier = 'professional'
    ON CONFLICT (warehouse_id) DO NOTHING;

END $$;
