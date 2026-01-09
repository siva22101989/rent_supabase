-- ============================================================================ 
-- GrainFlow Full-Scale Seed Data (Aligned with Consolidated Schema)
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
    RAISE NOTICE 'Starting Seed Process...';

    -- 1. Create Warehouses & Settings
    FOR v_i IN 1..3 LOOP 
        INSERT INTO public.warehouses (name, location, capacity_bags, phone, email, gst_number) 
        VALUES ( 
            (v_warehouse_names)[v_i], 
            'Industrial Area Phase ' || v_i, 
            10000 * v_i, 
            '987654321' || v_i, 
            'contact@' || lower(replace((v_warehouse_names)[v_i], ' ', '')) || '.com',
            '27ABCDE1234F1Z' || v_i
        ) 
        RETURNING id INTO v_warehouse_id; 

        -- Create Settings
        INSERT INTO public.warehouse_settings (warehouse_id, default_billing_cycle, currency, business_hours)
        VALUES (
            v_warehouse_id, 
            '1y', 
            'INR', 
            '{"start": "09:00", "end": "18:00", "days": ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]}'::jsonb
        );

        -- 2. Create Crops
        FOR v_j IN 1..4 LOOP 
            INSERT INTO public.crops (warehouse_id, name, rent_price_6m, rent_price_1y) 
            VALUES (v_warehouse_id, (v_crop_names)[v_j], 200 + (v_j * 20), 380 + (v_j * 35)) 
            RETURNING id INTO v_crop_id; 
        END LOOP; 

        -- 3. Create Lots
        FOR v_k IN 1..5 LOOP 
            INSERT INTO public.warehouse_lots (warehouse_id, name, capacity, status) 
            VALUES (v_warehouse_id, 'Lot ' || v_k || '-' || v_i, 2000, 'active') 
            RETURNING id INTO v_lot_id; 
        END LOOP; 

        -- 4. Create Customers & Records
        FOR v_l IN 1..20 LOOP 
            v_customer_id := gen_random_uuid(); 
            INSERT INTO public.customers (id, name, phone, address, warehouse_id, father_name, village) 
            VALUES ( 
                v_customer_id, 
                (v_customer_names)[((v_l-1) % 20) + 1] || ' ' || (v_i * 10 + v_l), 
                '990000' || (v_i * 1000 + v_l * 10), 
                'Village No ' || (v_l + v_i * 5), 
                v_warehouse_id, 
                'Father of ' || (v_customer_names)[((v_l-1) % 20) + 1], 
                'Green Valley' 
            ); 

            -- 5. Create Storage Records (Inflow)
            FOR v_record_count IN 1..(2 + floor(random() * 3))::INTEGER LOOP 
                v_record_id := gen_random_uuid(); 
                v_bags_stored := 50 + floor(random() * 450); 
                v_rent_billed := (v_bags_stored * 2); 

                -- Pick Crop/Lot
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
                    'purchase', 'UP-80-AB-' || (1000 + floor(random() * 8999)), 
                    now() - (INTERVAL '1 day' * (30 + floor(random() * 180))), 
                    v_rent_billed, 
                    '6m' 
                ); 

                -- 6. Inflow Unloading Record (Mirroring the inflow)
                INSERT INTO public.unloading_records (
                    warehouse_id, customer_id, crop_id, commodity_description, 
                    bags_unloaded, bags_remaining, lorry_tractor_no, destination
                ) VALUES (
                    v_warehouse_id, v_customer_id, v_crop_id, 'Seed Inflow',
                    v_bags_stored, 0, 'UP-80-AB-' || (1000 + floor(random() * 8999)), 'storage'
                );

                -- 7. Add Payments (70% chance)
                IF random() < 0.7 THEN 
                    v_payment_amount := v_rent_billed * (0.3 + random() * 0.7); 
                    INSERT INTO public.payments (storage_record_id, amount, type, payment_date, notes) 
                    VALUES (v_record_id, v_payment_amount, 'rent', now() - (INTERVAL '1 day' * floor(random() * 20)), 'Partial rent payment'); 
                END IF; 

                -- 8. Add Outflows (30% chance)
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

        -- 9. Create Expenses
        FOR v_exp_count IN 1..10 LOOP 
            INSERT INTO public.expenses (warehouse_id, description, amount, category, expense_date) 
            VALUES ( 
                v_warehouse_id, 
                'Utility / Maintenance ' || v_exp_count, 
                1000 + floor(random() * 5000), 
                (ARRAY['Electricity', 'Labor', 'Maintenance', 'Office'])[(1 + floor(random() * 4))::INTEGER], 
                now() - (INTERVAL '1 day' * floor(random() * 90)) 
            ); 
        END LOOP; 
    END LOOP; 

    -- 10. Link to Specific Cloud User
    -- Uses the specific User ID provided by the developer.
    
    DECLARE
        v_target_user_id UUID := '5e760ff8-6d5f-4804-ad52-7f05d7ff33fc';
        v_existing_email TEXT;
        v_target_warehouse UUID;
    BEGIN
        -- Try to get the email for this user (if they exist in auth.users)
        -- This ensures the profile has the correct email.
        SELECT email INTO v_existing_email 
        FROM auth.users 
        WHERE id = v_target_user_id;

        -- If email found (User exists), or just proceed with ID and placeholder if needed (though FK will fail if user missing)
        IF v_existing_email IS NOT NULL THEN
            -- Get ID of the first warehouse we created ('AgroCold Junction')
            SELECT id INTO v_target_warehouse FROM public.warehouses WHERE name = (v_warehouse_names)[1] LIMIT 1;
            
            -- Update or Insert Profile
            INSERT INTO public.profiles (id, warehouse_id, full_name, email, role)
            VALUES (v_target_user_id, v_target_warehouse, 'Specific Cloud User', v_existing_email, 'owner')
            ON CONFLICT (id) DO UPDATE 
            SET warehouse_id = EXCLUDED.warehouse_id, role = 'owner';
            
            RAISE NOTICE 'SUCCESS: Linked Warehouse "%" to User % (ID: %)', (v_warehouse_names)[1], v_existing_email, v_target_user_id;
        ELSE
            RAISE WARNING 'WARNING: User with ID % not found in auth.users. Profile NOT created.', v_target_user_id;
        END IF;
    END;

    RAISE NOTICE 'Seed Data Created Successfully!';
END $$;
