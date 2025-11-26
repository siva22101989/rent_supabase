
import { differenceInCalendarMonths, addMonths, isAfter, startOfDay, differenceInYears, differenceInMonths } from 'date-fns';
import type { StorageRecord } from '@/lib/definitions';

// Rates
export const RATE_6_MONTHS = 36;
export const RATE_1_YEAR = 55;

export type RecordStatusInfo = {
  status: string;
  nextBillingDate: Date | null;
  currentRate: number;
  alert: string | null;
};

export function getRecordStatus(record: StorageRecord): RecordStatusInfo {
  if (record.storageEndDate) {
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
    bagsToWithdraw: number
): { 
    rent: number;
    monthsStored: number;
    totalRentOwedPerBag: number;
    rentAlreadyPaidPerBag: number; // This will now always be 0
} {
  const startDate = startOfDay(record.storageStartDate);
  const endDate = startOfDay(withdrawalDate);
  
  const rentAlreadyPaidPerBag = 0; // Rent is never paid in advance.

  let totalRentOwedPerBag = 0;
  const monthsStored = differenceInMonths(endDate, startDate);

  // If withdrawal is within the first 6 months (0-6 months), charge the 6-month rate.
  if (monthsStored <= 6) {
    totalRentOwedPerBag = RATE_6_MONTHS;
  } 
  // If withdrawal is after 6 months but within the first year (7-12 months), charge the 1-year rate.
  else if (monthsStored <= 12) {
    totalRentOwedPerBag = RATE_1_YEAR;
  } 
  // If withdrawal is after 1 year, charge based on the number of years.
  else {
    // 55 for the first year + 36 for each additional year or part of a year.
    const additionalYears = Math.ceil((monthsStored - 12) / 12);
    totalRentOwedPerBag = RATE_1_YEAR + (additionalYears * RATE_6_MONTHS);
  }
  
  const finalRentForWithdrawnBags = totalRentOwedPerBag * bagsToWithdraw;

  return { 
      rent: Math.max(0, finalRentForWithdrawnBags),
      monthsStored,
      totalRentOwedPerBag,
      rentAlreadyPaidPerBag // Will be 0
  };
}
