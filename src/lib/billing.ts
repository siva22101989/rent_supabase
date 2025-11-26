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
    bagsToWithdraw: number
): { 
    rent: number;
    monthsStored: number;
    totalRentOwedPerBag: number;
    rentAlreadyPaidPerBag: number; // This will now always be 0
} {
  const startDate = startOfDay(toDate(record.storageStartDate));
  const endDate = startOfDay(withdrawalDate);
  
  const rentAlreadyPaidPerBag = 0; // Rent is never paid in advance.

  let totalRentOwedPerBag = 0;
  const monthsStored = differenceInMonths(endDate, startDate);

  if (monthsStored < 0) {
    // Should not happen, but as a safeguard
    totalRentOwedPerBag = 0;
  } else if (monthsStored <= 6) {
    totalRentOwedPerBag = RATE_6_MONTHS;
  } else if (monthsStored <= 12) {
    totalRentOwedPerBag = RATE_1_YEAR;
  } else {
    // After 1 year
    const fullYearsPastFirst = Math.floor((monthsStored - 1) / 12);
    
    totalRentOwedPerBag = fullYearsPastFirst * RATE_1_YEAR;

    const remainingMonths = monthsStored - (fullYearsPastFirst * 12);

    if (remainingMonths > 0) {
        if (remainingMonths <= 6) {
            totalRentOwedPerBag += RATE_6_MONTHS;
        } else {
            totalRentOwedPerBag += RATE_1_YEAR;
        }
    }
  }
  
  const finalRentForWithdrawnBags = totalRentOwedPerBag * bagsToWithdraw;

  return { 
      rent: Math.max(0, finalRentForWithdrawnBags),
      monthsStored,
      totalRentOwedPerBag,
      rentAlreadyPaidPerBag // Will be 0
  };
}
