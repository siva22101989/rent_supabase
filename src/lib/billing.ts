
import { differenceInCalendarMonths, addMonths, isAfter, startOfDay, differenceInDays } from 'date-fns';
import type { StorageRecord } from '@/lib/definitions';
import { RATE_6_MONTHS, RATE_1_YEAR } from '@/lib/data';

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

  // After 1 year, it's always in a 1-year renewal cycle
  if (monthsStored >= 12) {
    const yearsStored = Math.floor(monthsStored / 12);
    const nextBillingDate = addMonths(startDate, (yearsStored + 1) * 12);
    const status = `In 1-Year Renewal (Y${yearsStored + 1})`;

    if (isAfter(today, nextBillingDate) || today.getTime() === nextBillingDate.getTime()) {
      alert = `Renewal for Year ${yearsStored + 2} is due.`;
    }

    return { status, nextBillingDate, currentRate: RATE_1_YEAR, alert };
  }

  // Between 6 and 11 months, it's in the 1-year rollover period
  if (monthsStored >= 6) {
    const nextBillingDate = addMonths(startDate, 12);
    const status = 'Active - 1-Year Rollover';

    const rolloverDate = addMonths(startDate, 6);
    if ((isAfter(today, rolloverDate) || today.getTime() === rolloverDate.getTime()) && record.billingCycle === '6-Month Initial') {
      alert = `1-Year Rollover top-up is due.`;
    }

    return { status, nextBillingDate, currentRate: RATE_1_YEAR, alert };
  }

  // Between 0 and 5 months, it's in the initial 6-month term
  const nextBillingDate = addMonths(startDate, 6);
  const status = 'Active - 6-Month Term';
  return { status, nextBillingDate, currentRate: RATE_6_MONTHS, alert };
}


export function calculateFinalRent(record: StorageRecord, withdrawalDate: Date, bagsToWithdraw: number): { rent: number } {
  const statusInfo = getRecordStatus(record);

  // If a renewal or rollover alert is active, it means payment is due
  // The amount is the difference between the new rate and the old rate, or the full new rate
  if (statusInfo.alert) {
    if (statusInfo.alert.includes('Rollover')) {
      // Top-up from 6-month rate to 1-year rate
      const rentDue = (RATE_1_YEAR - RATE_6_MONTHS) * bagsToWithdraw;
      return { rent: rentDue > 0 ? rentDue : 0 };
    }
    if (statusInfo.alert.includes('Renewal')) {
      // New 1-year term rent
      const rentDue = RATE_1_YEAR * bagsToWithdraw;
      return { rent: rentDue > 0 ? rentDue : 0 };
    }
  }

  // If no alert, no additional rent is due upon withdrawal as it's pre-paid for the term.
  return { rent: 0 };
}
