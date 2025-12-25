import { PageHeader } from "@/components/shared/page-header";
import { getPendingPayments } from "@/lib/queries";
import { PendingPaymentsClient } from "./page-client";

export const dynamic = 'force-dynamic';

export default async function PendingPaymentsPage() {
    const pendingCustomers = await getPendingPayments(50);

    return (
    <>
            <PageHeader
                title="Pending Payments"
                description="View all customers with outstanding balances and record payments."
                breadcrumbs={[
                  { label: 'Dashboard', href: '/' },
                  { label: 'Payments' }
                ]}
            />
            <PendingPaymentsClient pendingCustomers={pendingCustomers} />
    </>
    );
}
