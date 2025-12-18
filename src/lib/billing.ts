import { differenceInCalendarMonths, addMonths, isAfter, startOfDay, differenceInYears, differenceInMonths } from 'date-fns';
import type { StorageRecord } from '@/lib/definitions';
import { toDate } from './utils';

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
  const monthsStored = differenceInMonths(endDate, startDate);

  if (monthsStored < 0) {
    // Should not happen, but as a safeguard
    rentPerBag = 0;
  } else if (monthsStored <= 6) {
    rentPerBag = rate6m;
  } else if (monthsStored <= 12) {
    rentPerBag = rate1y;
  } else {
    // After 1 year
    const fullYearsPastFirst = Math.floor((monthsStored - 1) / 12);
    
    rentPerBag = fullYearsPastFirst * rate1y;

    const remainingMonths = monthsStored - (fullYearsPastFirst * 12);

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
