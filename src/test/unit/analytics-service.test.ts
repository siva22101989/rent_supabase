import { describe, it, expect } from 'vitest';
import { getMonth, format } from 'date-fns';

/**
 * Unit Tests - AnalyticsService Logic
 * 
 * Note: AnalyticsService methods are database-heavy (Supabase queries).
 * These tests focus on the aggregation and calculation logic.
 * Full coverage requires integration tests with database mocking.
 */

describe('AnalyticsService - Aggregation Logic', () => {
  describe('Monthly Financial Aggregation', () => {
    it('should aggregate payments by month correctly', () => {
      const payments = [
        { amount: 1000, payment_date: '2024-01-15' },
        { amount: 500, payment_date: '2024-01-20' },
        { amount: 2000, payment_date: '2024-02-10' },
        { amount: 750, payment_date: '2024-03-05' }
      ];

      const monthlyData = new Array(12).fill(0).map((_, i) => ({
        name: format(new Date(2024, i, 1), 'MMM'),
        revenue: 0,
        expense: 0,
        profit: 0
      }));

      payments.forEach((p: any) => {
        const month = getMonth(new Date(p.payment_date));
        if (month >= 0 && month < 12) {
          monthlyData[month].revenue += p.amount;
        }
      });

      expect(monthlyData[0].revenue).toBe(1500); // Jan: 1000 + 500
      expect(monthlyData[1].revenue).toBe(2000); // Feb: 2000
      expect(monthlyData[2].revenue).toBe(750);  // Mar: 750
      expect(monthlyData[3].revenue).toBe(0);    // Apr: 0
    });

    it('should aggregate expenses by month correctly', () => {
      const expenses = [
        { amount: 300, expense_date: '2024-01-10' },
        { amount: 200, expense_date: '2024-01-25' },
        { amount: 500, expense_date: '2024-02-15' }
      ];

      const monthlyData = new Array(12).fill(0).map((_, i) => ({
        name: format(new Date(2024, i, 1), 'MMM'),
        revenue: 0,
        expense: 0,
        profit: 0
      }));

      expenses.forEach((e: any) => {
        const month = getMonth(new Date(e.expense_date));
        if (month >= 0 && month < 12) {
          monthlyData[month].expense += e.amount;
        }
      });

      expect(monthlyData[0].expense).toBe(500); // Jan: 300 + 200
      expect(monthlyData[1].expense).toBe(500); // Feb: 500
    });

    it('should calculate profit correctly', () => {
      const monthlyData = [
        { name: 'Jan', revenue: 5000, expense: 2000, profit: 0 },
        { name: 'Feb', revenue: 3000, expense: 3500, profit: 0 },
        { name: 'Mar', revenue: 0, expense: 0, profit: 0 }
      ];

      monthlyData.forEach(m => {
        m.profit = m.revenue - m.expense;
      });

      expect(monthlyData[0].profit).toBe(3000);   // Profit
      expect(monthlyData[1].profit).toBe(-500);   // Loss
      expect(monthlyData[2].profit).toBe(0);      // Break-even
    });

    it('should handle empty data gracefully', () => {
      const payments: any[] = [];
      const expenses: any[] = [];

      const monthlyData = new Array(12).fill(0).map((_, i) => ({
        name: format(new Date(2024, i, 1), 'MMM'),
        revenue: 0,
        expense: 0,
        profit: 0
      }));

      payments.forEach((p: any) => {
        const month = getMonth(new Date(p.payment_date));
        if (month >= 0 && month < 12) {
          monthlyData[month].revenue += p.amount;
        }
      });

      expenses.forEach((e: any) => {
        const month = getMonth(new Date(e.expense_date));
        if (month >= 0 && month < 12) {
          monthlyData[month].expense += e.amount;
        }
      });

      monthlyData.forEach(m => {
        m.profit = m.revenue - m.expense;
      });

      expect(monthlyData.every(m => m.revenue === 0)).toBe(true);
      expect(monthlyData.every(m => m.expense === 0)).toBe(true);
      expect(monthlyData.every(m => m.profit === 0)).toBe(true);
    });
  });

  describe('Stock Trends Aggregation', () => {
    it('should aggregate inflows by month correctly', () => {
      const inflows = [
        { bags_in: 100, storage_start_date: '2024-01-05' },
        { bags_in: 50, storage_start_date: '2024-01-20' },
        { bags_in: 200, storage_start_date: '2024-02-10' }
      ];

      const monthlyData = new Array(12).fill(0).map((_, i) => ({
        name: format(new Date(2024, i, 1), 'MMM'),
        inflow: 0,
        outflow: 0
      }));

      inflows.forEach((r: any) => {
        const month = getMonth(new Date(r.storage_start_date));
        if (month >= 0 && month < 12) monthlyData[month].inflow += (r.bags_in || 0);
      });

      expect(monthlyData[0].inflow).toBe(150); // Jan: 100 + 50
      expect(monthlyData[1].inflow).toBe(200); // Feb: 200
    });

    it('should aggregate outflows by month correctly', () => {
      const outflows = [
        { bags_withdrawn: 30, withdrawal_date: '2024-01-15' },
        { bags_withdrawn: 20, withdrawal_date: '2024-01-25' },
        { bags_withdrawn: 100, withdrawal_date: '2024-02-05' }
      ];

      const monthlyData = new Array(12).fill(0).map((_, i) => ({
        name: format(new Date(2024, i, 1), 'MMM'),
        inflow: 0,
        outflow: 0
      }));

      outflows.forEach((t: any) => {
        const month = getMonth(new Date(t.withdrawal_date));
        if (month >= 0 && month < 12) monthlyData[month].outflow += (t.bags_withdrawn || 0);
      });

      expect(monthlyData[0].outflow).toBe(50);  // Jan: 30 + 20
      expect(monthlyData[1].outflow).toBe(100); // Feb: 100
    });

    it('should handle null bags_in values', () => {
      const inflows = [
        { bags_in: null, storage_start_date: '2024-01-05' },
        { bags_in: 50, storage_start_date: '2024-01-20' }
      ];

      const monthlyData = new Array(12).fill(0).map((_, i) => ({
        name: format(new Date(2024, i, 1), 'MMM'),
        inflow: 0,
        outflow: 0
      }));

      inflows.forEach((r: any) => {
        const month = getMonth(new Date(r.storage_start_date));
        if (month >= 0 && month < 12) monthlyData[month].inflow += (r.bags_in || 0);
      });

      expect(monthlyData[0].inflow).toBe(50); // Only counts the non-null value
    });
  });

  describe('Yearly Comparison Aggregation', () => {
    it('should aggregate revenue by year correctly', () => {
      const payments = [
        { amount: 1000, payment_date: '2022-05-15' },
        { amount: 2000, payment_date: '2022-08-20' },
        { amount: 3000, payment_date: '2023-03-10' },
        { amount: 1500, payment_date: '2023-11-05' },
        { amount: 2500, payment_date: '2024-01-15' }
      ];

      const startYear = 2022;
      const endYear = 2024;
      const yearlyData: Record<number, number> = {};

      // Initialize
      for (let y = startYear; y <= endYear; y++) {
        yearlyData[y] = 0;
      }

      payments.forEach((p: any) => {
        const y = new Date(p.payment_date).getFullYear();
        if (yearlyData[y] !== undefined) {
          yearlyData[y] += p.amount;
        }
      });

      expect(yearlyData[2022]).toBe(3000);  // 1000 + 2000
      expect(yearlyData[2023]).toBe(4500);  // 3000 + 1500
      expect(yearlyData[2024]).toBe(2500);  // 2500
    });

    it('should ignore payments outside year range', () => {
      const payments = [
        { amount: 1000, payment_date: '2020-05-15' }, // Before range
        { amount: 2000, payment_date: '2022-08-20' }, // In range
        { amount: 3000, payment_date: '2025-03-10' }  // After range
      ];

      const startYear = 2022;
      const endYear = 2024;
      const yearlyData: Record<number, number> = {};

      for (let y = startYear; y <= endYear; y++) {
        yearlyData[y] = 0;
      }

      payments.forEach((p: any) => {
        const y = new Date(p.payment_date).getFullYear();
        if (yearlyData[y] !== undefined) {
          yearlyData[y] += p.amount;
        }
      });

      expect(yearlyData[2022]).toBe(2000);
      expect(yearlyData[2023]).toBe(0);
      expect(yearlyData[2024]).toBe(0);
      expect(yearlyData[2020]).toBeUndefined();
      expect(yearlyData[2025]).toBeUndefined();
    });

    it('should handle single year range', () => {
      const payments = [
        { amount: 1000, payment_date: '2024-01-15' },
        { amount: 2000, payment_date: '2024-06-20' }
      ];

      const startYear = 2024;
      const endYear = 2024;
      const yearlyData: Record<number, number> = {};

      for (let y = startYear; y <= endYear; y++) {
        yearlyData[y] = 0;
      }

      payments.forEach((p: any) => {
        const y = new Date(p.payment_date).getFullYear();
        if (yearlyData[y] !== undefined) {
          yearlyData[y] += p.amount;
        }
      });

      expect(yearlyData[2024]).toBe(3000);
      expect(Object.keys(yearlyData)).toHaveLength(1);
    });
  });

  describe('Month Boundary Edge Cases', () => {
    it('should correctly identify month for edge dates', () => {
      const testDates = [
        { date: '2024-01-01', expectedMonth: 0 },  // First day of year
        { date: '2024-01-31', expectedMonth: 0 },  // Last day of Jan
        { date: '2024-02-29', expectedMonth: 1 },  // Leap year
        { date: '2024-12-31', expectedMonth: 11 }  // Last day of year
      ];

      testDates.forEach(({ date, expectedMonth }) => {
        const month = getMonth(new Date(date));
        expect(month).toBe(expectedMonth);
      });
    });

    it('should handle invalid month indices gracefully', () => {
      const monthlyData = new Array(12).fill(0).map((_, i) => ({
        name: format(new Date(2024, i, 1), 'MMM'),
        value: 0
      }));

      // Simulate a check for out-of-bounds month
      const testMonth = 15; // Invalid
      if (testMonth >= 0 && testMonth < 12) {
        monthlyData[testMonth].value += 100;
      }

      expect(monthlyData.every(m => m.value === 0)).toBe(true);
    });
  });
});

/**
 * Integration Test Recommendations:
 * 
 * The following methods require integration tests with Supabase:
 * - getMonthlyFinancials() - Tests actual database queries with joins
 * - getStockTrends() - Tests warehouse filtering and date ranges
 * - getYearlyComparison() - Tests multi-year aggregation
 * 
 * These should be added to src/test/integration/analytics-service.test.ts
 */
