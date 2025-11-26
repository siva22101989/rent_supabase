
import { differenceInCalendarMonths, addMonths, isAfter, startOfDay, differenceInYears, addYears } from 'date-fns';
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
  const today = startOfDay(new Date());
  const startDate = record.storageStartDate;
  
  if (record.storageEndDate) {
    return {
      status: `Withdrawn`,
      nextBillingDate: null,
      currentRate: 0,
      alert: null,
    };
  }
  
  const monthsStored = differenceInCalendarMonths(today, startDate);

  let alert: string | null = null;
  let status: string;
  let nextBillingDate: Date | null;
  let currentRate: number;

  const initial6MonthDate = addMonths(startDate, 6);
  const initial12MonthDate = addMonths(startDate, 12);

  // Before 6 months
  if (isAfter(initial6MonthDate, today)) {
    status = 'Active - 6-Month Term';
    nextBillingDate = initial6MonthDate;
    currentRate = RATE_6_MONTHS;
  } 
  // Between 6 and 12 months
  else if (isAfter(initial12MonthDate, today)) {
    status = 'Active - 1-Year Rollover';
    nextBillingDate = initial12MonthDate;
    currentRate = RATE_1_YEAR;
    if (record.billingCycle === '6-Month Initial') {
        alert = `1-Year Rollover top-up is due.`;
    }
  } 
  // After 12 months
  else {
    const yearsStored = Math.floor(monthsStored / 12);
    const renewalYears = yearsStored; // The number of full years passed
    nextBillingDate = addMonths(startDate, (renewalYears + 1) * 12);
    status = `In 1-Year Renewal (Y${renewalYears + 1})`;
    currentRate = RATE_1_YEAR;
    
    // Check if the current date is past the last paid renewal date
    // The initial 12 months are covered by the first year rate.
    const lastRenewalDueDate = addMonths(startDate, renewalYears * 12);

    if (!isAfter(lastRenewalDueDate, today)) {
        alert = `Renewal for Year ${renewalYears + 1} is due.`;
    }
  }

  return { status, nextBillingDate, currentRate, alert };
}


export function calculateFinalRent(record: StorageRecord, withdrawalDate: Date, bagsToWithdraw: number): { rent: number } {
  const startDate = startOfDay(record.storageStartDate);
  const endDate = startOfDay(withdrawalDate);
  const monthsStored = differenceInCalendarMonths(endDate, startDate);

  const rentAlreadyPaidPerBag = (record.totalBilled - record.hamaliCharges) / record.bagsStored;

  let totalRentOwedPerBag = 0;

  if (monthsStored < 6) {
    // Withdrawing within the first 6 months. Rent is already covered.
    totalRentOwedPerBag = RATE_6_MONTHS;
  } else if (monthsStored < 12) {
    // Withdrawing between 6 and 12 months. Owe the full year rate.
    totalRentOwedPerBag = RATE_1_YEAR;
  } else { // monthsStored >= 12
    const yearsStored = Math.floor(monthsStored / 12);
    // Total owed is for (yearsStored + 1) full years.
    // e.g., stored for 13 months = 2 years of rent. 1 year + 1 renewal.
    totalRentOwedPerBag = RATE_1_YEAR * (yearsStored + 1);
  }

  const additionalRentForWithdrawnBags = (totalRentOwedPerBag - rentAlreadyPaidPerBag) * bagsToWithdraw;
  
  return { rent: Math.max(0, additionalRentForWithdrawnBags) };
}
