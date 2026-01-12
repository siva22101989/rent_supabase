'use server';

import { createClient } from '@/utils/supabase/server';
import { createNotification } from './logger';
import { revalidatePath } from 'next/cache';

export async function sendTestNotification(type: 'info' | 'warning' | 'error' | 'success' = 'success') {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { success: false, message: 'Unauthorized' };

    await createNotification(
        '🔔 Test Notification',
        `This is a test notification to verify real-time alerts. Sent at ${new Date().toLocaleTimeString()}`,
        type,
        user.id,
        '/dashboard'
    );

    revalidatePath('/', 'layout');
    return { success: true };
}
