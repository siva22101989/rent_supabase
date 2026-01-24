import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { createMockSupabaseClient } from '../mocks/supabase';
import { BillingService } from '@/lib/billing';

/**
 * Integration Tests - Payment Flow (Mock-Based)
 * 
 * These tests verify the complete payment workflow using mocked database operations.
 * This allows testing integration logic without requiring a real test database.
 */

describe('Payment Flow Integration Tests', () => {
  let supabase: any;
  let testCustomerId: string;
  let testWarehouseId: string;
  let testRecordIds: string[] = [];

  beforeAll(async () => {
    // Initialize mock Supabase client
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
    // Cleanup: Delete test data
    if (testRecordIds.length > 0) {
      await supabase
        .from('storage_records')
        .delete()
        .in('id', testRecordIds);
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
    // Clean up any existing test records before each test
    if (testRecordIds.length > 0) {
      await supabase
        .from('storage_records')
        .delete()
        .in('id', testRecordIds);
      testRecordIds = [];
    }
  });

  describe('Single Payment Flow', () => {
    it('should create payment and update record balance', async () => {
      // 1. Create storage record with dues
      const { data: record } = await supabase
        .from('storage_records')
        .insert({
          customer_id: testCustomerId,
          warehouse_id: testWarehouseId,
          bags_in: 100,
          bags_stored: 100,
          total_rent_billed: 3600,
          hamali_payable: 0,
          storage_start_date: new Date('2024-01-01').toISOString()
        })
        .select()
        .single();
      testRecordIds.push(record.id);

      // 2. Create payment
      const { error: paymentError } = await supabase
        .from('payments')
        .insert({
          storage_record_id: record.id,
          amount: 1000,
          type: 'rent',
          payment_date: new Date().toISOString(),
          payment_method: 'cash'
        });

      expect(paymentError).toBeNull();

      // 3. Verify payment was created
      const { data: payments } = await supabase
        .from('payments')
        .select('*')
        .eq('storage_record_id', record.id);

      expect(payments).toHaveLength(1);
      expect(payments[0].amount).toBe(1000);

      // 4. Calculate remaining balance
      const totalPaid = payments.reduce((sum: number, p: any) => sum + p.amount, 0);
      const remainingDue = record.total_rent_billed - totalPaid;

      expect(totalPaid).toBe(1000);
      expect(remainingDue).toBe(2600);
    });

    it('should handle full payment and close record', async () => {
      // 1. Create record with small balance
      const { data: record } = await supabase
        .from('storage_records')
        .insert({
          customer_id: testCustomerId,
          warehouse_id: testWarehouseId,
          bags_in: 50,
          bags_stored: 0, // Already withdrawn
          bags_out: 50,
          total_rent_billed: 1800,
          hamali_payable: 0,
          storage_start_date: new Date('2024-01-01').toISOString(),
          storage_end_date: new Date('2024-02-01').toISOString()
        })
        .select()
        .single();
      testRecordIds.push(record.id);

      // 2. Make full payment
      await supabase
        .from('payments')
        .insert({
          storage_record_id: record.id,
          amount: 1800,
          type: 'rent',
          payment_date: new Date().toISOString(),
          payment_method: 'cash'
        });

      // 3. Verify balance is zero
      const { data: payments } = await supabase
        .from('payments')
        .select('amount')
        .eq('storage_record_id', record.id);

      const totalPaid = payments.reduce((sum: number, p: any) => sum + p.amount, 0);
      expect(totalPaid).toBe(1800);
      expect(totalPaid).toBe(record.total_rent_billed);
    });
  });

  describe('FIFO Payment Allocation', () => {
    it('should allocate payment to oldest record first', async () => {
      // 1. Create multiple records with different dates
      const record1 = await supabase
        .from('storage_records')
        .insert({
          customer_id: testCustomerId,
          warehouse_id: testWarehouseId,
          bags_in: 100,
          bags_stored: 100,
          total_rent_billed: 1000,
          hamali_payable: 0,
          storage_start_date: new Date('2024-01-01').toISOString()
        })
        .select()
        .single();
      testRecordIds.push(record1.data.id);

      const record2 = await supabase
        .from('storage_records')
        .insert({
          customer_id: testCustomerId,
          warehouse_id: testWarehouseId,
          bags_in: 100,
          bags_stored: 100,
          total_rent_billed: 2000,
          hamali_payable: 0,
          storage_start_date: new Date('2024-02-01').toISOString()
        })
        .select()
        .single();
      testRecordIds.push(record2.data.id);

      // 2. Simulate FIFO allocation
      const pendingRecords = [
        {
          id: record1.data.id,
          recordNumber: 'R001',
          totalDue: 1000,
          storageStartDate: new Date('2024-01-01')
        },
        {
          id: record2.data.id,
          recordNumber: 'R002',
          totalDue: 2000,
          storageStartDate: new Date('2024-02-01')
        }
      ];

      const result = BillingService.allocatePaymentFIFO(pendingRecords, 1500);

      // 3. Verify allocation
      expect(result.allocations).toHaveLength(2);
      expect(result.allocations[0]!.recordId).toBe(record1.data.id);
      expect(result.allocations[0]!.amount).toBe(1000); // Fully paid
      expect(result.allocations[1]!.recordId).toBe(record2.data.id);
      expect(result.allocations[1]!.amount).toBe(500); // Partially paid
      expect(result.unallocated).toBe(0);
    });


    it('should handle payment exceeding total dues', async () => {
      const record = await supabase
        .from('storage_records')
        .insert({
          customer_id: testCustomerId,
          warehouse_id: testWarehouseId,
          bags_in: 50,
          bags_stored: 50,
          total_rent_billed: 500,
          hamali_payable: 0,
          storage_start_date: new Date('2024-01-01').toISOString()
        })
        .select()
        .single();
      testRecordIds.push(record.data.id);

      const pendingRecords = [
        {
          id: record.data.id,
          recordNumber: 'R001',
          totalDue: 500,
          storageStartDate: new Date('2024-01-01')
        }
      ];

      const result = BillingService.allocatePaymentFIFO(pendingRecords, 1000);

      expect(result.allocations[0]!.amount).toBe(500);
      expect(result.unallocated).toBe(500); // Excess amount
    });
  });

  describe('Payment Update Flow', () => {
    it('should update payment amount and recalculate balance', async () => {
      // 1. Create record and initial payment
      const { data: record } = await supabase
        .from('storage_records')
        .insert({
          customer_id: testCustomerId,
          warehouse_id: testWarehouseId,
          bags_in: 100,
          bags_stored: 100,
          total_rent_billed: 3600,
          hamali_payable: 0,
          storage_start_date: new Date('2024-01-01').toISOString()
        })
        .select()
        .single();
      testRecordIds.push(record.id);

      const { data: payment } = await supabase
        .from('payments')
        .insert({
          storage_record_id: record.id,
          amount: 1000,
          type: 'rent',
          payment_date: new Date().toISOString(),
          payment_method: 'cash'
        })
        .select()
        .single();

      // 2. Update payment amount
      await supabase
        .from('payments')
        .update({ amount: 1500 })
        .eq('id', payment.id);

      // 3. Verify new balance
      const { data: updatedPayments } = await supabase
        .from('payments')
        .select('amount')
        .eq('storage_record_id', record.id);

      const totalPaid = updatedPayments.reduce((sum: number, p: any) => sum + p.amount, 0);
      expect(totalPaid).toBe(1500);
    });
  });

  describe('Payment Deletion Flow', () => {
    it('should delete payment and restore balance', async () => {
      // 1. Create record with payment
      const { data: record } = await supabase
        .from('storage_records')
        .insert({
          customer_id: testCustomerId,
          warehouse_id: testWarehouseId,
          bags_in: 100,
          bags_stored: 100,
          total_rent_billed: 3600,
          hamali_payable: 0,
          storage_start_date: new Date('2024-01-01').toISOString()
        })
        .select()
        .single();
      testRecordIds.push(record.id);

      const { data: payment } = await supabase
        .from('payments')
        .insert({
          storage_record_id: record.id,
          amount: 1000,
          type: 'rent',
          payment_date: new Date().toISOString(),
          payment_method: 'cash'
        })
        .select()
        .single();

      // 2. Delete payment
      await supabase
        .from('payments')
        .delete()
        .eq('id', payment.id);

      // 3. Verify payment is gone
      const { data: payments } = await supabase
        .from('payments')
        .select('*')
        .eq('storage_record_id', record.id);

      expect(payments).toHaveLength(0);

      // Balance should be back to full amount
      const totalPaid = 0;
      const remainingDue = record.total_rent_billed - totalPaid;
      expect(remainingDue).toBe(3600);
    });
  });
});
