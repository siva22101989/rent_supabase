'use client';

import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Clock, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { getTrialDaysRemaining, isTrialExpiringSoon } from '@/lib/trial-utils';
import { useSubscription } from '@/components/providers/subscription-context';

export function TrialBanner() {
  const { subscription, loading } = useSubscription();
  
  if (loading || !subscription || subscription.status !== 'trailing_trial') return null;
  
  const daysRemaining = getTrialDaysRemaining(subscription.trial_end_date || null);
  const isExpiringSoon = isTrialExpiringSoon(subscription.trial_end_date || null);
  
  // Don't show if negative days (expired but not yet processed by cron)
  if (daysRemaining < 0) return null;

  return (
    <Alert variant={isExpiringSoon ? 'destructive' : 'default'} className="mb-6 border-l-4">
      <Sparkles className="h-4 w-4" />
      <AlertTitle className="font-bold flex items-center gap-2">
        {isExpiringSoon ? 'Trial Ending Soon!' : 'Free Trial Active'}
      </AlertTitle>
      <AlertDescription className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mt-2">
        <span className="flex items-center gap-2">
          <Clock className="h-4 w-4" />
          You have <strong>{daysRemaining} day{daysRemaining !== 1 ? 's' : ''}</strong> remaining in your free trial.
        </span>
        <Button size="sm" variant={isExpiringSoon ? "outline" : "default"} asChild className="whitespace-nowrap">
          <Link href="/billing">Upgrade Now</Link>
        </Button>
      </AlertDescription>
    </Alert>
  );
}
