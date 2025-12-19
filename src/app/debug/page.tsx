import { getCustomerRecords } from '@/lib/queries';

export default async function DebugPage() {
    const records = await getCustomerRecords('47e93651-e3d9-4f63-812b-41d536e80033'); // Customer ID for Nikhil
    
    return (
        <pre>{JSON.stringify(records, null, 2)}</pre>
    );
}
export const dynamic = 'force-dynamic';
