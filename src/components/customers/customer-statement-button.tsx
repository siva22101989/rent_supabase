'use client';

import { CustomerStatementDialog } from './customer-statement-dialog';
import type { Customer, StorageRecord } from '@/lib/definitions';

import { DateRange } from 'react-day-picker';

interface Props {
    customer: Customer;
    records: StorageRecord[];
    dateRange?: DateRange;
}

export function CustomerStatementButton({ customer, records, dateRange }: Props) {
    return (
        <CustomerStatementDialog customer={customer} records={records} dateRange={dateRange} />
    );
}
