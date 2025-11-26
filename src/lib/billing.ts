
import { differenceInCalendarMonths, addMonths, isAfter, startOfDay } from 'date-fns';
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
    const renewalYears = yearsStored + 1;
    nextBillingDate = addMonths(startDate, renewalYears * 12);
    status = `In 1-Year Renewal (Y${renewalYears})`;
    currentRate = RATE_1_YEAR;
    
    // Check if the current date is past the last paid renewal date
    const lastRenewalDate = addMonths(startDate, yearsStored * 12);
    if (!isAfter(lastRenewalDate, today)) {
      alert = `Renewal for Year ${renewalYears + 1} is due.`;
    }
  }

  return { status, nextBillingDate, currentRate, alert };
}

export function calculateFinalRent(record: StorageRecord, withdrawalDate: Date, bagsToWithdraw: number): { rent: number } {
  const startDate = record.storageStartDate;
  
  // Total months from start until withdrawal
  const monthsStored = differenceInCalendarMonths(startOfDay(withdrawalDate), startDate);

  let rentDue = 0;

  // Case 1: Withdrawal after 6 months but before 12 months
  // User has paid for 6 months (₹36). They need to pay the difference to meet the 1-year rate (₹55).
  if (monthsStored >= 6 && monthsStored < 12 && record.billingCycle === '6-Month Initial') {
      rentDue = (RATE_1_YEAR - RATE_6_MONTHS) * bagsToWithdraw;
  }
  // Case 2: Withdrawal after 12 months or more
  else if (monthsStored >= 12) {
    const yearsStoredOnWithdrawal = Math.floor(monthsStored / 12);
    const renewalDate = addMonths(startDate, yearsStoredOnWithdrawal * 12);

    // If withdrawing on or after the anniversary date for a new year, the full year's rent is due.
    if (!isAfter(renewalDate, startOfDay(withdrawalDate))) {
        rentDue = RATE_1_YEAR * bagsToWithdraw;
    }
  }
  
  // If withdrawing within the first 6 months, or within a year that has already been paid for,
  // no *additional* rent is due.
  return { rent: rentDue };
}
