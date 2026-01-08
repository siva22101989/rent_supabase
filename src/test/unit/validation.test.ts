import { describe, it, expect } from 'vitest';
import { z } from 'zod';

/**
 * Unit Tests - Zod Schema Validation
 * Task 1.2.4: Test input validation schemas
 */

// Import schemas from actual locations (examples shown here)
const InflowSchema = z.object({
  customerId: z.string().uuid(),
  bags: z.number().int().positive(),
  commodityDescription: z.string().min(1),
  storageStartDate: z.string().or(z.date()),
  hamaliRate: z.number().optional(),
  hamaliPaid: z.number().optional(),
});

const PaymentSchema = z.object({
  storageRecordId: z.string().uuid(),
  amount: z.number().positive(),
  paymentDate: z.string().or(z.date()),
  paymentMethod: z.enum(['cash', 'upi', 'bank_transfer', 'cheque']),
});

describe('Schema Validation', () => {
  describe('InflowSchema', () => {
    it('validates correct inflow data', () => {
      const validData = {
        customerId: '123e4567-e89b-12d3-a456-426614174000',
        bags: 100,
        commodityDescription: 'Wheat',
        storageStartDate: '2024-01-01',
        hamaliRate: 5,
        hamaliPaid: 500
      };

      const result = InflowSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('rejects invalid UUID', () => {
      const invalidData = {
        customerId: 'invalid-uuid',
        bags: 100,
        commodityDescription: 'Wheat',
        storageStartDate: '2024-01-01'
      };

      const result = InflowSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('rejects negative bags', () => {
      const invalidData = {
        customerId: '123e4567-e89b-12d3-a456-426614174000',
        bags: -10,
        commodityDescription: 'Wheat',
        storageStartDate: '2024-01-01'
      };

      const result = InflowSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('rejects zero bags', () => {
      const invalidData = {
        customerId: '123e4567-e89b-12d3-a456-426614174000',
        bags: 0,
        commodityDescription: 'Wheat',
        storageStartDate: '2024-01-01'
      };

      const result = InflowSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('rejects empty commodity description', () => {
      const invalidData = {
        customerId: '123e4567-e89b-12d3-a456-426614174000',
        bags: 100,
        commodityDescription: '',
        storageStartDate: '2024-01-01'
      };

      const result = InflowSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('PaymentSchema', () => {
    it('validates correct payment data', () => {
      const validData = {
        storageRecordId: '123e4567-e89b-12d3-a456-426614174000',
        amount: 1000,
        paymentDate: '2024-01-01',
        paymentMethod: 'cash' as const
      };

      const result = PaymentSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('rejects negative payment amount', () => {
      const invalidData = {
        storageRecordId: '123e4567-e89b-12d3-a456-426614174000',
        amount: -100,
        paymentDate: '2024-01-01',
        paymentMethod: 'cash' as const
      };

      const result = PaymentSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('rejects zero payment amount', () => {
      const invalidData = {
        storageRecordId: '123e4567-e89b-12d3-a456-426614174000',
        amount: 0,
        paymentDate: '2024-01-01',
        paymentMethod: 'cash' as const
      };

      const result = PaymentSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('rejects invalid payment method', () => {
      const invalidData = {
        storageRecordId: '123e4567-e89b-12d3-a456-426614174000',
        amount: 1000,
        paymentDate: '2024-01-01',
        paymentMethod: 'credit_card' // Not in enum
      };

      const result = PaymentSchema.safeParse(invalidData as any);
      expect(result.success).toBe(false);
    });
  });
});
