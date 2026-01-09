import { describe, it, expect } from 'vitest';
import { calculateFinalRent } from './billing';
import { addMonths, addDays, subDays } from 'date-fns';
import type { StorageRecord } from '@/lib/definitions';

// Helper to create a mock record
const mockRecord = (startDate: Date): StorageRecord => ({
    id: 'reg_1',
    customerId: 'cust_1',
    commodityDescription: 'Regression Crop',
    storageStartDate: startDate,
    bagsStored: 100,
    bagsIn: 100,
    bagsOut: 0,
    hamaliPayable: 0,
    billingCycle: '6m',
    location: 'Lot X',
    lorryTractorNo: '',
    inflowType: 'purchase',
    totalRentBilled: 0,
    storageEndDate: null,
    payments: []
});

const PRICING = { price6m: 36, price1y: 55 };

describe('Billing Regression Suite', () => {

    describe('1. Boundary Analysis', () => {
        const start = new Date(2024, 0, 1); // Jan 1, 2024

        it('Exact 6 Months: Should charge 6-month rate', () => {
            const end = addMonths(start, 6); // July 1
            const result = calculateFinalRent(mockRecord(start), end, 100, PRICING);
            expect(result.rentPerBag).toBe(36);
        });

        it('6 Months + 1 Day: Should charge 1-year rate', () => {
            const end = addDays(addMonths(start, 6), 1); // July 2
            const result = calculateFinalRent(mockRecord(start), end, 100, PRICING);
            expect(result.rentPerBag).toBe(55);
        });

        it('Exact 1 Year: Should charge 1-year rate', () => {
            const end = addMonths(start, 12); // Jan 1, 2025
            const result = calculateFinalRent(mockRecord(start), end, 100, PRICING);
            expect(result.rentPerBag).toBe(55);
        });

        it('1 Year + 1 Day: Should trigger next 6-month cycle', () => {
             const end = addDays(addMonths(start, 12), 1);
             const result = calculateFinalRent(mockRecord(start), end, 100, PRICING);
             expect(result.rentPerBag).toBe(91);
        });
    });

    describe('2. Leap Year Scenarios', () => {
        // 2024 is a leap year (Feb has 29 days)
        const leapStart = new Date(2024, 1, 28); // Feb 28, 2024

        it('Should handle transition over Feb 29th', () => {
             const end = addDays(leapStart, 2); // Mar 1, 2024 (2 days later)
             const result = calculateFinalRent(mockRecord(leapStart), end, 100, PRICING);
             // Should count as 0 months effectively (within first 6m)
             expect(result.rentPerBag).toBe(36); 
        });
    });

    describe('3. Long-Term Storage', () => {
        const start = new Date(2020, 0, 1);

        it('2 Years Exact: Should charge 2 x 1-year rate', () => {
            const end = addMonths(start, 24);
            const result = calculateFinalRent(mockRecord(start), end, 100, PRICING);
            expect(result.rentPerBag).toBe(110);
        });

        it('2 Years + 1 Month: Should charge 2yr + 6m rate', () => {
            const end = addMonths(start, 25);
            const result = calculateFinalRent(mockRecord(start), end, 100, PRICING);
            expect(result.rentPerBag).toBe(146);
        });
    });

    describe('4. Resilience & Fallbacks', () => {
        const start = new Date(2024, 0, 1);

        it('Should fallback to constants if pricing is undefined', () => {
            const end = addMonths(start, 3);
            const result = calculateFinalRent(mockRecord(start), end, 100, undefined);
            expect(result.rentPerBag).toBe(36);
        });

        it('Should calculate correctly for partial bag withdrawals', () => {
            const end = addMonths(start, 3);
            const result = calculateFinalRent(mockRecord(start), end, 50, PRICING);
            expect(result.rent).toBe(1800);
            expect(result.rentPerBag).toBe(36);
        });

        it('Should default 0 rent if withdrawal date is before start date', () => {
            const end = subDays(start, 1);
            const result = calculateFinalRent(mockRecord(start), end, 100, PRICING);
            expect(result.rent).toBe(0);
        });
    });
});
