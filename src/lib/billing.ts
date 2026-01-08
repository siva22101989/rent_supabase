import { differenceInCalendarMonths, addMonths, isAfter, startOfDay, differenceInYears, differenceInMonths } from 'date-fns';
import type { StorageRecord } from '@/lib/definitions';
import { toDate } from './utils';

import { BILLING_RATES } from '@/lib/constants';

// Rates
// Deprecated: Use BILLING_RATES from @/lib/constants
export const RATE_6_MONTHS = BILLING_RATES.SIX_MONTHS;
export const RATE_1_YEAR = BILLING_RATES.ONE_YEAR;

export type RecordStatusInfo = {
  status: string;
  nextBillingDate: Date | null;
  currentRate: number;
  alert: string | null;
};

export function getRecordStatus(record: StorageRecord): RecordStatusInfo {
  const safeRecord = {
    ...record,
    storageStartDate: toDate(record.storageStartDate),
    storageEndDate: record.storageEndDate ? toDate(record.storageEndDate) : null
  };

  if (safeRecord.storageEndDate) {
    return {
      status: `Withdrawn`,
      nextBillingDate: null,
      currentRate: 0,
      alert: null,
    };
  }
  
  // Since rent is only calculated at withdrawal, the status is always simply "Active".
  // The concept of next billing date or current rate before withdrawal is not applicable.
  return {
    status: 'Active',
    nextBillingDate: null,
    currentRate: 0,
    alert: null,
  };
}


export function calculateFinalRent(
    record: StorageRecord, 
    withdrawalDate: Date, 
    bagsToWithdraw: number,
    pricing?: { price6m: number, price1y: number }
): { 
    rent: number;
    monthsStored: number;
    rentPerBag: number;
    rentAlreadyPaidPerBag: number; // This will now always be 0
} {
  const startDate = startOfDay(toDate(record.storageStartDate));
  const endDate = startOfDay(withdrawalDate);
  
  const rentAlreadyPaidPerBag = 0; // Rent is never paid in advance.

  // Use dynamic pricing if available, else fallback to constants
  const rate6m = pricing?.price6m ?? RATE_6_MONTHS;
  const rate1y = pricing?.price1y ?? RATE_1_YEAR;

  let rentPerBag = 0;
  
  // Calculate raw month difference
  let monthsStored = differenceInMonths(endDate, startDate);
  
  // Check if we have entered into the next month even by a day
  // differenceInMonths truncates. e.g. Jan 1 to Feb 2 is 1 month.
  // We want to know if it's strictly > X months.
  // If endDate > startDate + monthsStored, it means we are into the next month fraction.
  const exactMonthBoundary = addMonths(startDate, monthsStored);
  if (isAfter(endDate, exactMonthBoundary)) {
      monthsStored += 1;
  }

  // Minimum 1 month charge (implied by 6m bracket, but good for clarity if logic changes)
  if (monthsStored === 0 && isAfter(endDate, startDate)) {
      monthsStored = 1; 
  }

  // Handle invalid or negative duration
  if (monthsStored <= 0) {
      rentPerBag = 0;
  } else if (monthsStored <= 6) {
    rentPerBag = rate6m;
  } else if (monthsStored <= 12) {
    rentPerBag = rate1y;
  } else {
    // Multi-year logic
    // Year 1 is covered by rate1y. Subsequent years are additive.
    // Example: 13 months. 
    // We treat first 12 months as Year 1 (rate1y).
    // Remaining = 1 month.
    
    // Total chunks of 12 months fully completed or entered
    const fullYears = Math.floor((monthsStored - 1) / 12);
    
    rentPerBag = fullYears * rate1y;

    const remainingMonths = monthsStored - (fullYears * 12);

    if (remainingMonths > 0) {
        if (remainingMonths <= 6) {
             rentPerBag += rate6m;
        } else {
             rentPerBag += rate1y;
        }
    }
  }
  
  const finalRentForWithdrawnBags = rentPerBag * bagsToWithdraw;

  return { 
      rent: Math.max(0, finalRentForWithdrawnBags),
      monthsStored,
      rentPerBag,
      rentAlreadyPaidPerBag // Will be 0
  };
}

export class BillingService {
  /**
   * Calculate exact rent for a withdrawal
   */
  static calculateRent(
    record: StorageRecord, 
    withdrawalDate: Date, 
    bagsToWithdraw: number,
    pricing?: { price6m: number, price1y: number }
  ) {
    return calculateFinalRent(record, withdrawalDate, bagsToWithdraw, pricing);
  }

  /**
   * Determine the impact of a new outflow on the storage record
   */
  static calculateOutflowImpact(
    record: StorageRecord, 
    bagsWithdrawn: number, 
    rentAmount: number, 
    withdrawalDate: Date
  ) {
    const currentBagsStored = record.bagsStored;
    const currentBagsOut = record.bagsOut || 0;
    const currentTotalRent = record.totalRentBilled || 0;

    const newBagsStored = Math.max(0, currentBagsStored - bagsWithdrawn);
    const newBagsOut = currentBagsOut + bagsWithdrawn;
    const newTotalRent = currentTotalRent + rentAmount;

    const isClosed = newBagsStored === 0;

    const updates: Partial<StorageRecord> = {
      bagsStored: newBagsStored,
      bagsOut: newBagsOut,
      totalRentBilled: newTotalRent,
    };

    if (isClosed) {
      updates.storageEndDate = withdrawalDate;
      updates.billingCycle = 'Completed';
    }

    return { updates, isClosed };
  }

  /**
   * Determine impact of Reverting (Deleting) an outflow
   */
  static calculateReversalImpact(
    record: StorageRecord,
    transactionBags: number,
    transactionRent: number
  ) {
    const currentBagsStored = record.bagsStored;
    const currentBagsOut = record.bagsOut || 0;
    const currentTotalRent = record.totalRentBilled || 0;

    const newBagsStored = currentBagsStored + transactionBags;
    // Ensure we don't go below zero if data is messy, but logically it should be fine
    const newBagsOut = Math.max(0, currentBagsOut - transactionBags);
    const newTotalRent = Math.max(0, currentTotalRent - transactionRent);

    const updates: Partial<StorageRecord> = {
      bagsStored: newBagsStored,
      bagsOut: newBagsOut,
      totalRentBilled: newTotalRent,
    };

    // If we restored bags, record calls for Re-opening
    const shouldReopen = record.storageEndDate !== null && newBagsStored > 0;
    if (shouldReopen) {
      updates.storageEndDate = null;
      updates.billingCycle = '6-Month Initial';
      // Note: Ideal logic would determine correct cycle based on duration, but '6-Month Initial' implies 'Open'
    }

    return { updates, shouldReopen };
  }

  /**
   * Determine impact of Updating an existing outflow
   */
  static calculateUpdateImpact(
    record: StorageRecord,
    oldTransaction: { bags: number, rent: number },
    newTransaction: { bags: number, rent: number, date: Date }
  ) {
    const bagsDiff = newTransaction.bags - oldTransaction.bags;
    const rentDiff = newTransaction.rent - oldTransaction.rent;

    // Validation: Check simplified specific check
    // Logic: If withdrawing MORE (bagsDiff > 0), need stock.
    if (bagsDiff > 0 && record.bagsStored < bagsDiff) {
       throw new Error(`Cannot increase withdrawal by ${bagsDiff} bags. Only ${record.bagsStored} bags available.`);
    }

    const currentBagsStored = record.bagsStored;
    const currentBagsOut = record.bagsOut || 0;
    const currentTotalRent = record.totalRentBilled || 0;

    const updates: Partial<StorageRecord> = {
        bagsStored: currentBagsStored - bagsDiff,
        bagsOut: currentBagsOut + bagsDiff,
        totalRentBilled: Math.max(0, currentTotalRent + rentDiff)
    };

    // Status Check
    if (updates.bagsStored === 0) {
        updates.storageEndDate = newTransaction.date;
        updates.billingCycle = 'Completed';
    } else {
        // Functionally open
        if (record.storageEndDate) {
            updates.storageEndDate = null;
            updates.billingCycle = '6-Month Initial';
        }
    }

    return { updates };
  }

  /**
   * FIFO Allocation: Allocate payment to oldest records first
   */
  static allocatePaymentFIFO(records: { id: string; recordNumber: string; totalDue: number }[], totalAmount: number) {
      const allocations: { recordId: string; recordNumber: string; amount: number; remainingDue: number }[] = [];
      let remaining = totalAmount;
  
      for (const record of records) {
          if (remaining <= 0) {
              allocations.push({
                  recordId: record.id,
                  recordNumber: record.recordNumber,
                  amount: 0,
                  remainingDue: record.totalDue
              });
              continue;
          }
  
          const allocated = Math.min(remaining, record.totalDue);
          allocations.push({
              recordId: record.id,
              recordNumber: record.recordNumber,
              amount: allocated,
              remainingDue: record.totalDue - allocated
          });
          remaining -= allocated;
      }
  
      return { allocations, unallocated: remaining };
  }
}
