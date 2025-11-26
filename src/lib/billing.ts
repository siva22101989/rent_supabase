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

  const sixMonthsLater = addMonths(startDate, 6);
  const twelveMonthsLater = addMonths(startDate, 12);

  // If withdrawal is within the first 6 months, charge the 6-month rate.
  if (!isAfter(endDate, sixMonthsLater)) {
    totalRentOwedPerBag = RATE_6_MONTHS;
  } 
  // If withdrawal is after 6 months but within the first year, charge the 1-year rate.
  else if (!isAfter(endDate, twelveMonthsLater)) {
    totalRentOwedPerBag = RATE_1_YEAR;
  } 
  // If withdrawal is after 1 year, charge based on the number of years.
  else {
    const years = differenceInYears(endDate, startDate);
    // e.g., 13 months is 1 year diff, needs 2 years rent. 25 months is 2 years diff, needs 3 years rent.
    totalRentOwedPerBag = RATE_1_YEAR * (years + 1);
  }
  
  const finalRentForWithdrawnBags = totalRentOwedPerBag * bagsToWithdraw;
  const monthsStored = differenceInMonths(endDate, startDate);

  return { 
      rent: Math.max(0, finalRentForWithdrawnBags),
      monthsStored,
      totalRentOwedPerBag,
      rentAlreadyPaidPerBag // Will be 0
  };
}
