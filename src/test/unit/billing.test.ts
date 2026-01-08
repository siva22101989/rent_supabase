import { describe, it, expect } from 'vitest';
import { calculateFinalRent } from '@/lib/billing';

/**
 * Unit Tests - Billing Calculations
 * Task 1.2.2: Critical business logic testing
 */

describe('Billing Calculations', () => {
  describe('calculateFinalRent', () => {
    it('calculates rent correctly for 1 month storage', () => {
      const record = {
        id: 'test-id',
        storageStartDate: new Date('2024-01-01'),
        bags: 100,
      } as any;

      const result = calculateFinalRent(
        record,
        new Date('2024-02-01'), // withdrawal date (1 month later)
        100, // bags to withdraw
        { price6m: 5, price1y: 10 }
      );
      
      // 100 bags * 5 rate (6m pricing) = 500
      expect(result.rent).toBe(500);
      expect(result.monthsStored).toBe(1);
    });

    it('calculates rent for partial months (rounds up)', () => {
      const record = {
        id: 'test-id',
        storageStartDate: new Date('2024-01-01'),
        bags: 100,
      } as any;

      const result = calculateFinalRent(
        record,
        new Date('2024-01-15'), // 15 days (partial month)
        100,
        { price6m: 5, price1y: 10 }
      );
      
      // Should charge for full month
      expect(result.rent).toBe(500);
      expect(result.monthsStored).toBe(1);
    });

    it('handles zero bags correctly', () => {
      const record = {
        id: 'test-id',
        storageStartDate: new Date('2024-01-01'),
        bags: 100,
      } as any;

      const result = calculateFinalRent(
        record,
        new Date('2024-02-01'),
        0, // zero bags to withdraw
        { price6m: 5, price1y: 10 }
      );
      
      expect(result.rent).toBe(0);
    });

    it('handles multi-month storage correctly (7 months = 1y rate)', () => {
      const record = {
        id: 'test-id',
        storageStartDate: new Date('2024-01-01'),
        bags: 200,
      } as any;

      const result = calculateFinalRent(
        record,
        new Date('2024-08-01'), // 7 months later
        200,
        { price6m: 10, price1y: 15 } // 1y rate applies for 7+ months
      );
      
      // 200 bags * 15 (1y rate) = 3000
      expect(result.rent).toBe(3000);
      expect(result.monthsStored).toBe(7);
    });

    it('uses 6 month rate for storage <= 6 months', () => {
      const record = {
        id: 'test-id',
        storageStartDate: new Date('2024-01-01'),
        bags: 100,
      } as any;

      const result = calculateFinalRent(
        record,
        new Date('2024-07-01'), // exactly 6 months
        100,
        { price6m: 36, price1y: 55 }
      );
      
      // Should use 6 month rate
      expect(result.rent).toBe(3600); // 100 * 36
      expect(result.monthsStored).toBe(6);
    });
  });
});
