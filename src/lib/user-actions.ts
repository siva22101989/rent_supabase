'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';
import { logError } from '@/lib/error-logger';

export async function completeOnboardingTour() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) return;

    // Get existing preferences first to merge
    const { data: profile } = await supabase
        .from('profiles')
        .select('preferences')
        .eq('id', user.id)
        .single();
    
    const existingPrefs = profile?.preferences || {};

    const { error } = await supabase
        .from('profiles')
        .update({
            preferences: {
                ...existingPrefs,
                tourCompleted: true
            }
        })
        .eq('id', user.id);

    if (error) {
        logError(error, { operation: 'completeOnboardingTour', userId: user.id });
        return { success: false };
    }

    revalidatePath('/', 'layout');
    return { success: true };
}
