import { createClient } from '@supabase/supabase-js';

// Helper to cleanup test data
export async function cleanupTestData(emailPattern: string) {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
        throw new Error('Missing Supabase env vars for cleanup');
    }

    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Delete customers created by automated tests
    const { error } = await supabase
        .from('customers')
        .delete()
        .ilike('name', emailPattern); // e.g., 'AutoTest_%'

    if (error) {
        console.error('Error cleaning up test customers:', error);
    } else {
        console.log(`Cleaned up test customers matching ${emailPattern}`);
    }
}
