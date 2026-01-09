'use server';

import { createClient } from '@/utils/supabase/server';
import { checkRateLimit } from '@/lib/rate-limit';
import { redirect } from 'next/navigation';

export async function sendPortalLoginLink(prevState: any, formData: FormData) {
    const rawPhone = formData.get('phone') as string;
    
    if (!rawPhone || typeof rawPhone !== 'string') {
        return { success: false, message: 'Invalid phone number.' };
    }

    // Clean phone number (remove spaces, dashes)
    const cleanPhone = rawPhone.replace(/\D/g, '');
    
    if (cleanPhone.length !== 10) {
        return { success: false, message: 'Please enter a valid 10-digit mobile number.' };
    }

    const phone = `+91${cleanPhone}`;

    try {
        // 1. Rate Limit
        await checkRateLimit(phone, 'portalLogin', { limit: 5, windowMs: 15 * 60 * 1000 }); // 5 attempts per 15 min

        const supabase = await createClient();

        // 2. Send OTP
        const { error } = await supabase.auth.signInWithOtp({
            phone,
            options: {
                shouldCreateUser: true, // Allow creation, trigger will link
                // Phone auth doesn't use emailRedirectTo usually, but good to keep clean
            },
        });

        if (error) {
            console.error('Portal Login Error:', error);
            return { success: false, message: error.message };
        }

        return { success: true, message: `OTP sent to ${phone}. Check your messages.` };

    } catch (error: any) {
        return { success: false, message: error.message || 'Something went wrong.' };
    }
}
