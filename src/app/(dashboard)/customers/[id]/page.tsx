
import { getCustomer, getCustomerRecords } from '@/lib/queries';
import { notFound } from 'next/navigation';
import { CustomerDetailsClient } from './customer-details-client';

export const dynamic = 'force-dynamic';

export default async function CustomerDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const [customer, records] = await Promise.all([
        getCustomer(id),
        getCustomerRecords(id)
    ]);

    if (!customer) {
        notFound();
    }

    return <CustomerDetailsClient customer={customer} initialRecords={records} />;
}
