import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { createMockSupabaseClient } from '../mocks/supabase';
import { BillingService } from '@/lib/billing';

/**
 * Integration Tests - Outflow Flow (Mock-Based)
 * 
 * These tests verify the complete outflow workflow using mocked database operations.
 */

describe('Outflow Flow Integration Tests', () => {
  let supabase: any;
  let testCustomerId: string;
  let testWarehouseId: string;
  let testRecordId: string;

  beforeAll(async () => {
    supabase = createMockSupabaseClient();

    // Create test warehouse
    const { data: warehouse } = await supabase
      .from('warehouses')
      .insert({ name: 'Test Warehouse', location: 'Test Location' })
      .select()
      .single();
    testWarehouseId = warehouse.id;

    // Create test customer
    const { data: customer } = await supabase
      .from('customers')
      .insert({
        name: 'Test Customer',
        phone: '1234567890',
        warehouse_id: testWarehouseId
      })
      .select()
      .single();
    testCustomerId = customer.id;
  });

  afterAll(async () => {
    if (testRecordId) {
      await supabase
        .from('storage_records')
        .delete()
        .eq('id', testRecordId);
    }

    if (testCustomerId) {
      await supabase
        .from('customers')
        .delete()
        .eq('id', testCustomerId);
    }

    if (testWarehouseId) {
      await supabase
        .from('warehouses')
        .delete()
        .eq('id', testWarehouseId);
    }
  });

  beforeEach(async () => {
    if (testRecordId) {
      await supabase
        .from('withdrawal_transactions')
        .delete()
        .eq('storage_record_id', testRecordId);

      await supabase
        .from('storage_records')
        .delete()
        .eq('id', testRecordId);
    }
  });

  describe('Outflow Creation', () => {
    it('should create outflow and calculate rent correctly', async () => {
      // 1. Create storage record
      const recordData = {
        customer_id: testCustomerId,
        warehouse_id: testWarehouseId,
        bags_in: 100,
        bagsStored: 100, // Mock uses camelCase
        bagsOut: 0,
        total_rent_billed: 0,
        totalRentBilled: 0, // Mock uses camelCase
        hamali_payable: 0,
        storage_start_date: new Date('2024-01-01').toISOString(),
        storageStartDate: new Date('2024-01-01') // Mock uses camelCase
      };

      const { data: record } = await supabase
        .from('storage_records')
        .insert(recordData)
        .select()
        .single();
      
      testRecordId = record.id;

      // 2. Calculate rent for withdrawal (1 month storage)
      const withdrawalDate = new Date('2024-02-01');
      const rentCalculation = BillingService.calculateRent(
        { ...record, bagsStored: 100, storageStartDate: new Date('2024-01-01') } as any,
        withdrawalDate,
        50, // Withdraw 50 bags
        { price6m: 36, price1y: 55 }
      );

      expect(rentCalculation.rent).toBe(1800); // 50 bags * 36 rate

      // 3. Create outflow
      const { data: outflow } = await supabase
        .from('withdrawal_transactions')
        .insert({
          storage_record_id: record.id,
          warehouse_id: testWarehouseId,
          bags_withdrawn: 50,
          rent_charged: rentCalculation.rent,
          withdrawal_date: withdrawalDate.toISOString()
        })
        .select()
        .single();

      expect(outflow.bags_withdrawn).toBe(50);
      expect(outflow.rent_charged).toBe(1800);

      // 4. Update record using BillingService logic
      const impact = BillingService.calculateOutflowImpact(
        { ...record, bagsStored: 100, bagsOut: 0, totalRentBilled: 0 } as any,
        50,
        1800,
        withdrawalDate
      );

      expect(impact.updates.bagsStored).toBe(50); // 100 - 50
      expect(impact.updates.bagsOut).toBe(50);
      expect(impact.updates.totalRentBilled).toBe(1800);
      expect(impact.isClosed).toBe(false); // Still has 50 bags
    });

    it('should close record when fully withdrawn', async () => {
      // 1. Create storage record
      const recordData = {
        customer_id: testCustomerId,
        warehouse_id: testWarehouseId,
        bags_in: 100,
        bagsStored: 100,
        bagsOut: 0,
        total_rent_billed: 0,
        totalRentBilled: 0,
        hamali_payable: 0,
        storage_start_date: new Date('2024-01-01').toISOString(),
        storageStartDate: new Date('2024-01-01')
      };

      const { data: record } = await supabase
        .from('storage_records')
        .insert(recordData)
        .select()
        .single();
      
      testRecordId = record.id;

      // 2. Withdraw all bags
      const withdrawalDate = new Date('2024-02-01');
      const rentCalculation = BillingService.calculateRent(
        { ...record, bagsStored: 100, storageStartDate: new Date('2024-01-01') } as any,
        withdrawalDate,
        100, // Withdraw all
        { price6m: 36, price1y: 55 }
      );

      const impact = BillingService.calculateOutflowImpact(
        { ...record, bagsStored: 100, bagsOut: 0, totalRentBilled: 0 } as any,
        100,
        rentCalculation.rent,
        withdrawalDate
      );

      expect(impact.updates.bagsStored).toBe(0);
      expect(impact.updates.bagsOut).toBe(100);
      expect(impact.isClosed).toBe(true);
      expect(impact.updates.storageEndDate).toEqual(withdrawalDate);
      expect(impact.updates.billingCycle).toBe('Completed');
    });
  });

  describe('Outflow Update', () => {
    it('should recalculate rent when quantity changes', async () => {
      // 1. Create record with existing outflow
      const recordData = {
        customer_id: testCustomerId,
        warehouse_id: testWarehouseId,
        bags_in: 100,
        bagsStored: 50,
        bagsOut: 50,
        total_rent_billed: 1800,
        totalRentBilled: 1800,
        hamali_payable: 0,
        storage_start_date: new Date('2024-01-01').toISOString()
      };

      const { data: record } = await supabase
        .from('storage_records')
        .insert(recordData)
        .select()
        .single();
      testRecordId = record.id;

      // 2. Update outflow quantity (increase from 50 to 100)
      const oldTransaction = { bags: 50, rent: 1800 };
      const newTransaction = {
        bags: 100,
        rent: 3600,
        date: new Date('2024-02-01')
      };

      const impact = BillingService.calculateUpdateImpact(
        { ...record, bagsStored: 50, bagsOut: 50, totalRentBilled: 1800 } as any,
        oldTransaction,
        newTransaction
      );

      expect(impact.updates.totalRentBilled).toBe(3600);
      expect(impact.updates.bagsStored).toBe(0); // 50 - (100 - 50) = 0
      expect(impact.updates.bagsOut).toBe(100); // 50 + (100 - 50) = 100
    });
  });

  describe('Outflow Reversal', () => {
    it('should reverse outflow and restore bags', async () => {
      // 1. Create closed record (fully withdrawn)
      const recordData = {
        customer_id: testCustomerId,
        warehouse_id: testWarehouseId,
        bags_in: 100,
        bagsStored: 0,
        bagsOut: 100,
        total_rent_billed: 3600,
        totalRentBilled: 3600,
        hamali_payable: 0,
        storage_start_date: new Date('2024-01-01').toISOString(),
        storage_end_date: new Date('2024-02-01').toISOString(),
        billing_cycle: 'Completed',
        storageEndDate: new Date('2024-02-01'),
        billingCycle: 'Completed'
      };

      const { data: record } = await supabase
        .from('storage_records')
        .insert(recordData)
        .select()
        .single();
      testRecordId = record.id;

      // 2. Reverse the outflow
      const impact = BillingService.calculateReversalImpact(
        { ...record, bagsStored: 0, bagsOut: 100, totalRentBilled: 3600, storageEndDate: new Date('2024-02-01') } as any,
        100, // Transaction bags
        3600 // Transaction rent
      );

      expect(impact.updates.bagsStored).toBe(100); // Restored
      expect(impact.updates.bagsOut).toBe(0);
      expect(impact.updates.totalRentBilled).toBe(0);
      expect(impact.updates.storageEndDate).toBeNull(); // Reopened
      expect(impact.updates.billingCycle).toBe('6-Month Initial');
    });

    it('should handle partial outflow reversal', async () => {
      // 1. Create record with partial withdrawal
      const recordData = {
        customer_id: testCustomerId,
        warehouse_id: testWarehouseId,
        bags_in: 100,
        bagsStored: 50,
        bagsOut: 50,
        total_rent_billed: 1800,
        totalRentBilled: 1800,
        hamali_payable: 0,
        storage_start_date: new Date('2024-01-01').toISOString()
      };

      const { data: record } = await supabase
        .from('storage_records')
        .insert(recordData)
        .select()
        .single();
      testRecordId = record.id;

      // 2. Reverse partial outflow
      const impact = BillingService.calculateReversalImpact(
        { ...record, bagsStored: 50, bagsOut: 50, totalRentBilled: 1800 } as any,
        50,
        1800
      );

      expect(impact.updates.bagsStored).toBe(100); // 50 + 50
      expect(impact.updates.bagsOut).toBe(0);
      expect(impact.updates.totalRentBilled).toBe(0);
    });
  });

  describe('Multiple Outflows', () => {
    it('should accumulate rent across multiple withdrawals', async () => {
      // 1. Create storage record
      const { data: record } = await supabase
        .from('storage_records')
        .insert({
          customer_id: testCustomerId,
          warehouse_id: testWarehouseId,
          bags_in: 100,
          bags_stored: 100,
          total_rent_billed: 0,
          hamali_payable: 0,
          storage_start_date: new Date('2024-01-01').toISOString()
        })
        .select()
        .single();
      testRecordId = record.id;

      // 2. First outflow (50 bags)
      const impact1 = BillingService.calculateOutflowImpact(
        { ...record, bagsStored: 100, bagsOut: 0, totalRentBilled: 0 } as any,
        50,
        1800,
        new Date('2024-02-01')
      );

      expect(impact1.updates.totalRentBilled).toBe(1800);
      expect(impact1.updates.bagsStored).toBe(50);

      // 3. Update record state
      const updatedRecord = { 
        ...record, 
        bagsStored: impact1.updates.bagsStored,
        bagsOut: impact1.updates.bagsOut,
        totalRentBilled: impact1.updates.totalRentBilled
      };

      // 4. Second outflow (remaining 50 bags)
      const impact2 = BillingService.calculateOutflowImpact(
        updatedRecord,
        50,
        1800,
        new Date('2024-03-01')
      );

      expect(impact2.updates.totalRentBilled).toBe(3600); // 1800 + 1800
      expect(impact2.updates.bagsStored).toBe(0);
      expect(impact2.isClosed).toBe(true);
    });
  });
});

/**
 * To enable these tests:
 * 
 * 1. Set up a test Supabase instance or use local Supabase
 * 2. Configure test environment variables in .env.test
 * 3. Remove the .skip from describe.skip
 * 4. Run: npm run test:integration
 */
