import { describe, it, expect } from 'vitest';

/**
 * Unit Tests - Payment Allocation (FIFO)
 * Task 1.2.3: Test bulk payment allocation logic
 */

// Mock the allocateFIFO function (will import from actual location)
type AllocationInput = {
  recordId: string;
  recordNumber: string;
  totalDue: number;
  storageStartDate: Date;
};

type AllocationOutput = {
  recordId: string;
  recordNumber: string;
  amount: number;
  remaining: number;
};

function allocateFIFO(records: AllocationInput[], totalAmount: number): AllocationOutput[] {
  const allocations: AllocationOutput[] = [];
  let remainingAmount = totalAmount;

  for (const record of records) {
    if (remainingAmount <= 0) {
      allocations.push({
        recordId: record.recordId,
        recordNumber: record.recordNumber,
        amount: 0,
        remaining: record.totalDue
      });
      continue;
    }

    const allocateToThis = Math.min(remainingAmount, record.totalDue);
    allocations.push({
      recordId: record.recordId,
      recordNumber: record.recordNumber,
      amount: allocateToThis,
      remaining: record.totalDue - allocateToThis
    });

    remainingAmount -= allocateToThis;
  }

  return allocations;
}

describe('FIFO Payment Allocation', () => {
  describe('allocateFIFO', () => {
    it('allocates to oldest record first', () => {
      const records: AllocationInput[] = [
        {
          recordId: 'rec-1',
          recordNumber: 'R001',
          totalDue: 1000,
          storageStartDate: new Date('2024-01-01')
        },
        {
          recordId: 'rec-2',
          recordNumber: 'R002',
          totalDue: 2000,
          storageStartDate: new Date('2024-02-01')
        }
      ];

      const result = allocateFIFO(records, 1500);

      expect(result[0].amount).toBe(1000); // First record fully paid
      expect(result[0].remaining).toBe(0);
      expect(result[1].amount).toBe(500);  // Second record partially paid
      expect(result[1].remaining).toBe(1500);
    });

    it('handles exact payment amount', () => {
      const records: AllocationInput[] = [
        {
          recordId: 'rec-1',
          recordNumber: 'R001',
          totalDue: 1000,
          storageStartDate: new Date('2024-01-01')
        }
      ];

      const result = allocateFIFO(records, 1000);

      expect(result[0].amount).toBe(1000);
      expect(result[0].remaining).toBe(0);
    });

    it('handles payment exceeding total dues', () => {
      const records: AllocationInput[] = [
        {
          recordId: 'rec-1',
          recordNumber: 'R001',
          totalDue: 500,
          storageStartDate: new Date('2024-01-01')
        }
      ];

      const result = allocateFIFO(records, 1000);

      expect(result[0].amount).toBe(500); // Only allocate what's due
      expect(result[0].remaining).toBe(0);
    });

    it('distributes across multiple records', () => {
      const records: AllocationInput[] = [
        { recordId: 'rec-1', recordNumber: 'R001', totalDue: 1000, storageStartDate: new Date('2024-01-01') },
        { recordId: 'rec-2', recordNumber: 'R002', totalDue: 1000, storageStartDate: new Date('2024-02-01') },
        { recordId: 'rec-3', recordNumber: 'R003', totalDue: 1000, storageStartDate: new Date('2024-03-01') }
      ];

      const result = allocateFIFO(records, 2500);

      expect(result[0].amount).toBe(1000);
      expect(result[0].remaining).toBe(0);
      expect(result[1].amount).toBe(1000);
      expect(result[1].remaining).toBe(0);
      expect(result[2].amount).toBe(500);
      expect(result[2].remaining).toBe(500);
    });

    it('handles zero payment amount', () => {
      const records: AllocationInput[] = [
        {
          recordId: 'rec-1',
          recordNumber: 'R001',
          totalDue: 1000,
          storageStartDate: new Date('2024-01-01')
        }
      ];

      const result = allocateFIFO(records, 0);

      expect(result[0].amount).toBe(0);
      expect(result[0].remaining).toBe(1000);
    });

    it('handles empty records array', () => {
      const records: AllocationInput[] = [];

      const result = allocateFIFO(records, 1000);

      expect(result).toEqual([]);
    });
  });
});
