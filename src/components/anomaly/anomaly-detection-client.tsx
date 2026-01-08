
'use client';

import { useFormState } from 'react-dom';
import { ShieldAlert } from 'lucide-react';
import { SubmitButton } from "@/components/ui/submit-button";
import { getAnomalyDetection } from '@/lib/actions/storage/records';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

type AnomalyState = {
  anomalies: string | null;
  success: boolean;
};

// Local SubmitButton removed in favor of shared component

export function AnomalyDetectionClient() {
  const initialState: AnomalyState = { anomalies: null, success: true };
  const [state, formAction] = useFormState(getAnomalyDetection, initialState);

  return (
    <div className="flex flex-col items-center justify-center text-center">
      <form action={formAction}>
        <SubmitButton size="lg">
          <ShieldAlert className="mr-2 h-4 w-4" />
          Analyze Storage Records
        </SubmitButton>
      </form>

      {state.anomalies && (
        <Card className="mt-8 w-full max-w-2xl text-left">
          <CardContent className="p-6">
            <h3 className="font-semibold mb-4">Analysis Results:</h3>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
              {state.anomalies}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
