'use client';

import { Button } from '@/components/ui/button';
import { FileText } from 'lucide-react';
import { generateCustomerStatement } from '@/lib/export-utils';
import type { Customer, StorageRecord } from '@/lib/definitions';

interface Props {
    customer: Customer;
    records: StorageRecord[];
}

export function CustomerStatementButton({ customer, records }: Props) {
    const handleExport = () => {
        generateCustomerStatement(customer, records);
    };

    return (
        <Button onClick={handleExport} variant="outline" size="sm">
            <FileText className="mr-2 h-4 w-4" />
            Download Statement
        </Button>
    );
}
