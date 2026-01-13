import { createClient } from '@/utils/supabase/server';
import { User } from '@supabase/supabase-js';
import * as Sentry from "@sentry/nextjs";
import { logError, logWarning } from './error-logger';
import { UserRole } from '@/types/db';

export type ActionState<T = any> = {
  success: boolean;
  message: string;
  data?: T;
};

/**
 * A higher-order function that wraps a server action with:
 * 1. Authentication check
 * 2. User role fetching (to avoid redundant queries)
 * 3. Sentry tracing
 * 4. Standardized error handling
 */
export async function authenticatedAction<T>(
  actionName: string,
  handler: (user: User, supabase: any, userRole: UserRole) => Promise<ActionState<T>>
): Promise<ActionState<T>> {
  return Sentry.startSpan(
    {
      op: "action",
      name: actionName,
    },
    async (span) => {
      try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
          logWarning(`Unauthorized attempt to execute ${actionName}`, { operation: actionName });
          return { success: false, message: 'Unauthorized' };
        }

        // Fetch user role once to avoid redundant queries in handlers
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();

        const userRole = (profile?.role as UserRole) || UserRole.STAFF;

        // Add user context to Sentry
        Sentry.setUser({ id: user.id, email: user.email });
        Sentry.setTag('userRole', userRole);

        return await handler(user, supabase, userRole);

      } catch (error: any) {
        logError(error, { operation: actionName });
        return { 
          success: false, 
          message: error.message || 'An unexpected error occurred.' 
        };
      }
    }
  );
}
