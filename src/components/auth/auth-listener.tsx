'use client';

import { useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { logLoginActivity } from '@/lib/actions';

export function AuthListener() {
    useEffect(() => {
        const supabase = createClient();
        
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (event === 'SIGNED_IN' && session?.user) {
                // Log the login activity
                await logLoginActivity();
            }
        });

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    return null; // This component doesn't render anything
}
