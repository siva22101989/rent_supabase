import { createClient } from '@/utils/supabase/server';
import { cache } from 'react';

// Cache the user fetch for the duration of the request
export const getAuthUser = cache(async () => {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
});
