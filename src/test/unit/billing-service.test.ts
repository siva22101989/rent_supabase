import { describe, it, expect } from 'vitest';
import { BillingService } from '@/lib/billing';
import type { StorageRecord } from '@/lib/definitions';

/**
 * Unit Tests - BillingService
 * Tests the newly refactored BillingService class methods
 */

describe('BillingService', () => {
  describe('calculateOutflowImpact', () => {
    it('calculates impact for full withdrawal', () => {
      const record: Partial<StorageRecord> = {
        id: 'rec-1',
        bagsStored: 100,
        bagsOut: 0,
        totalRentBilled: 0,
      };

      const result = BillingService.calculateOutflowImpact(
        record as StorageRecord,
        100, // bags withdrawn
        3600, // rent amount
        new Date('2024-02-01')
      );

      expect(result.updates.bagsStored).toBe(0);
      expect(result.updates.bagsOut).toBe(100);
      expect(result.updates.totalRentBilled).toBe(3600);
      expect(result.updates.storageEndDate).toEqual(new Date('2024-02-01'));
      // billingCycle is no longer set to 'Completed' on closure.
      // Closure is determined by storageEndDate.
      expect(result.isClosed).toBe(true);
    });

    it('calculates impact for partial withdrawal', () => {
      const record: Partial<StorageRecord> = {
        id: 'rec-1',
        bagsStored: 100,
        bagsOut: 0,
        totalRentBilled: 0,
      };

      const result = BillingService.calculateOutflowImpact(
        record as StorageRecord,
        50, // bags withdrawn
        1800, // rent amount
        new Date('2024-02-01')
      );

      expect(result.updates.bagsStored).toBe(50);
      expect(result.updates.bagsOut).toBe(50);
      expect(result.updates.totalRentBilled).toBe(1800);
      expect(result.updates.storageEndDate).toBeUndefined(); // Not closed
      expect(result.isClosed).toBe(false);
    });

    it('accumulates rent for multiple outflows', () => {
      const record: Partial<StorageRecord> = {
        id: 'rec-1',
        bagsStored: 50,
        bagsOut: 50,
        totalRentBilled: 1800, // Previous outflow
      };

      const result = BillingService.calculateOutflowImpact(
        record as StorageRecord,
        50, // withdraw remaining
        1800, // additional rent
        new Date('2024-02-01')
      );

      expect(result.updates.totalRentBilled).toBe(3600); // 1800 + 1800
      expect(result.updates.bagsOut).toBe(100);
      expect(result.isClosed).toBe(true);
    });
  });

  describe('calculateReversalImpact', () => {
    it('reverses rent and reopens closed record', () => {
      const record: Partial<StorageRecord> = {
        id: 'rec-1',
        bagsStored: 0,
        bagsOut: 100,
        totalRentBilled: 3600,
        storageEndDate: new Date('2024-02-01'),
        billingCycle: '6m',
      };

      const result = BillingService.calculateReversalImpact(
        record as StorageRecord,
        100, // transaction bags
        3600 // transaction rent
      );

      expect(result.updates.totalRentBilled).toBe(0);
      expect(result.updates.bagsStored).toBe(100);
      expect(result.updates.bagsOut).toBe(0);
      expect(result.updates.storageEndDate).toBeNull();
      expect(result.updates.billingCycle).toBe('6m');
    });

    it('reverses partial outflow correctly', () => {
      const record: Partial<StorageRecord> = {
        id: 'rec-1',
        bagsStored: 50,
        bagsOut: 50,
        totalRentBilled: 1800,
        storageEndDate: null,
      };

      const result = BillingService.calculateReversalImpact(
        record as StorageRecord,
        50, // transaction bags
        1800 // transaction rent
      );

      expect(result.updates.totalRentBilled).toBe(0);
      expect(result.updates.bagsStored).toBe(100);
      expect(result.updates.bagsOut).toBe(0);
    });
  });

  describe('calculateUpdateImpact', () => {
    it('recalculates impact when quantity increases', () => {
      const record: Partial<StorageRecord> = {
        id: 'rec-1',
        bagsStored: 50,
        bagsOut: 50,
        totalRentBilled: 1800,
      };

      const result = BillingService.calculateUpdateImpact(
        record as StorageRecord,
        { bags: 50, rent: 1800 }, // old transaction
        { bags: 100, rent: 3600, date: new Date('2024-02-01') } // new transaction
      );

      expect(result.updates.totalRentBilled).toBe(3600);
      expect(result.updates.bagsStored).toBe(0); // 50 - (100 - 50) = 0
      expect(result.updates.bagsOut).toBe(100); // 50 + (100 - 50) = 100
    });

    it('handles quantity decrease correctly', () => {
      const record: Partial<StorageRecord> = {
        id: 'rec-1',
        bagsStored: 0,
        bagsOut: 100,
        totalRentBilled: 3600,
        storageEndDate: new Date('2024-02-01'),
        billingCycle: '6m',
      };

      const result = BillingService.calculateUpdateImpact(
        record as StorageRecord,
        { bags: 100, rent: 3600 }, // old transaction
        { bags: 50, rent: 1800, date: new Date('2024-02-01') } // new transaction
      );

      expect(result.updates.totalRentBilled).toBe(1800);
      expect(result.updates.bagsStored).toBe(50); // 0 - (50 - 100) = 50
      expect(result.updates.bagsOut).toBe(50); // 100 + (50 - 100) = 50
      expect(result.updates.storageEndDate).toBeNull(); // Reopened
      expect(result.updates.billingCycle).toBe('6m');
    });
  });

  describe('allocatePaymentFIFO', () => {
    it('allocates payment to oldest record first', () => {
      const records = [
        {
          id: 'rec-1',
          recordNumber: 'R001',
          totalDue: 1000,
          storageStartDate: new Date('2024-01-01'),
        },
        {
          id: 'rec-2',
          recordNumber: 'R002',
          totalDue: 2000,
          storageStartDate: new Date('2024-02-01'),
        },
      ];

      const result = BillingService.allocatePaymentFIFO(records, 1500);

      expect(result.allocations).toHaveLength(2);
      expect(result.allocations[0].amount).toBe(1000);
      expect(result.allocations[0].remainingDue).toBe(0);
      expect(result.allocations[1].amount).toBe(500);
      expect(result.allocations[1].remainingDue).toBe(1500);
      expect(result.unallocated).toBe(0);
    });

    it('handles payment exceeding total dues', () => {
      const records = [
        {
          id: 'rec-1',
          recordNumber: 'R001',
          totalDue: 500,
          storageStartDate: new Date('2024-01-01'),
        },
      ];

      const result = BillingService.allocatePaymentFIFO(records, 1000);

      expect(result.allocations).toHaveLength(1);
      expect(result.allocations[0].amount).toBe(500);
      expect(result.allocations[0].remainingDue).toBe(0);
      expect(result.unallocated).toBe(500); // 500 excess
    });

    it('distributes across multiple records', () => {
      const records = [
        { id: 'rec-1', recordNumber: 'R001', totalDue: 1000, storageStartDate: new Date('2024-01-01') },
        { id: 'rec-2', recordNumber: 'R002', totalDue: 1000, storageStartDate: new Date('2024-02-01') },
        { id: 'rec-3', recordNumber: 'R003', totalDue: 1000, storageStartDate: new Date('2024-03-01') },
      ];

      const result = BillingService.allocatePaymentFIFO(records, 2500);

      expect(result.allocations).toHaveLength(3);
      expect(result.allocations[0].amount).toBe(1000);
      expect(result.allocations[1].amount).toBe(1000);
      expect(result.allocations[2].amount).toBe(500);
      expect(result.allocations[2].remainingDue).toBe(500);
      expect(result.unallocated).toBe(0);
    });

    it('handles zero payment amount', () => {
      const records = [
        {
          id: 'rec-1',
          recordNumber: 'R001',
          totalDue: 1000,
          storageStartDate: new Date('2024-01-01'),
        },
      ];

      const result = BillingService.allocatePaymentFIFO(records, 0);

      expect(result.allocations).toHaveLength(1);
      expect(result.allocations[0].amount).toBe(0);
      expect(result.allocations[0].remainingDue).toBe(1000);
      expect(result.unallocated).toBe(0);
    });
  });
});
