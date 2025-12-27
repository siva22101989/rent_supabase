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
