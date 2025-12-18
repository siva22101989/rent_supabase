'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle, XCircle, Loader2, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { joinWarehouse } from '@/lib/warehouse-actions';

export default function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Verifying invitation...');

  useEffect(() => {
    const claimInvite = async () => {
        try {
            const res = await joinWarehouse(resolvedParams.token);
            if (res.success) {
                setStatus('success');
                setMessage('You have successfully joined the warehouse!');
            } else {
                setStatus('error');
                setMessage(res.message);
            }
        } catch (err) {
            setStatus('error');
            setMessage('Something went wrong. Please try again.');
        }
    };
    
    // Auto-claim on mount
    claimInvite();
  }, [resolvedParams.token]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-muted/40 p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            {status === 'loading' && <Loader2 className="h-8 w-8 animate-spin text-primary" />}
            {status === 'success' && <CheckCircle className="h-8 w-8 text-green-500" />}
            {status === 'error' && <XCircle className="h-8 w-8 text-destructive" />}
          </div>
          <CardTitle>
            {status === 'loading' && 'Joining Warehouse...'}
            {status === 'success' && 'Welcome Aboard!'}
            {status === 'error' && 'Invitation Failed'}
          </CardTitle>
          <CardDescription>{message}</CardDescription>
        </CardHeader>
        <CardFooter className="justify-center">
            {status === 'success' && (
                <Button onClick={() => router.push('/')}>
                    Go to Dashboard <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
            )}
            {status === 'error' && (
                <Button variant="outline" onClick={() => router.push('/')}>
                    Back to Home
                </Button>
            )}
        </CardFooter>
      </Card>
    </div>
  );
}
