'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { createSubscriptionPaymentLink } from '@/lib/subscription-actions';
import { useToast } from '@/hooks/use-toast';
import { ArrowUpCircle, Check, Loader2 } from 'lucide-react';
import { PlanTier } from '@/lib/feature-flags';

type Plan = {
  tier: PlanTier;
  name: string;
  display_name: string;
  price: number;
  duration_days: number;
  features: {
    max_records?: number;
    max_warehouses?: number;
    priority_support?: boolean;
    advanced_reports?: boolean;
  };
};

type UpgradePlanButtonProps = {
  currentTier: PlanTier;
  warehouseId: string;
  availablePlans: Plan[];
};

export function UpgradePlanButton({ currentTier, warehouseId, availablePlans }: UpgradePlanButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);
  const { toast } = useToast();

  const handleUpgrade = async (planTier: string) => {
    try {
      setLoading(planTier);
      
      const result = await createSubscriptionPaymentLink(warehouseId, planTier, false);
      
      if (result.success && result.linkUrl) {
        toast({
          title: 'Payment Link Created',
          description: 'Opening payment link in a new tab...',
        });
        
        // Open payment link in new tab
        window.open(result.linkUrl, '_blank');
        setIsOpen(false);
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to create payment link',
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Something went wrong',
        variant: 'destructive',
      });
    } finally {
      setLoading(null);
    }
  };

  // Filter plans that are upgrades from current tier
  const upgradePlans = availablePlans.filter(plan => {
    if (currentTier === 'free') return plan.tier !== 'free';
    if (currentTier === 'starter_monthly') return ['professional_monthly', 'professional_yearly', 'enterprise_monthly', 'enterprise_yearly'].includes(plan.tier);
    if (currentTier === 'starter_yearly') return ['professional_monthly', 'professional_yearly', 'enterprise_monthly', 'enterprise_yearly'].includes(plan.tier);
    if (currentTier === 'professional_monthly') return ['professional_yearly', 'enterprise_monthly', 'enterprise_yearly'].includes(plan.tier);
    if (currentTier === 'professional_yearly') return ['enterprise_monthly', 'enterprise_yearly'].includes(plan.tier);
    return false;
  });

  if (upgradePlans.length === 0) {
    return null; // Already on highest plan
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <ArrowUpCircle className="h-4 w-4" />
          Upgrade Plan
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Upgrade Your Plan</DialogTitle>
          <DialogDescription>
            Choose a plan that best fits your warehouse needs
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          {upgradePlans.map((plan) => {
            const isYearly = plan.tier.includes('yearly');
            const monthlyPrice = isYearly 
              ? Math.round(plan.price / 12) 
              : plan.price;

            return (
              <Card key={plan.tier} className="relative">
                {isYearly && (
                  <Badge className="absolute top-4 right-4 bg-green-600">
                    Save {Math.round((1 - (plan.price / 12) / monthlyPrice) * 100)}%
                  </Badge>
                )}
                
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    {plan.display_name}
                  </CardTitle>
                  <CardDescription>
                    <div className="mt-2">
                      <span className="text-3xl font-bold text-foreground">
                        ₹{monthlyPrice.toLocaleString('en-IN')}
                      </span>
                      <span className="text-muted-foreground">/month</span>
                    </div>
                    {isYearly && (
                      <p className="text-xs mt-1">
                        Billed ₹{plan.price.toLocaleString('en-IN')} yearly
                      </p>
                    )}
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Feature>
                      {plan.features.max_records || 'Unlimited'} storage records
                    </Feature>
                    <Feature>
                      {plan.features.max_warehouses || 'Unlimited'} warehouses
                    </Feature>
                    {plan.features.priority_support && (
                      <Feature>Priority support</Feature>
                    )}
                    {plan.features.advanced_reports && (
                      <Feature>Advanced reports & analytics</Feature>
                    )}
                  </div>

                  <Button
                    className="w-full"
                    onClick={() => handleUpgrade(plan.tier)}
                    disabled={loading !== null}
                  >
                    {loading === plan.tier ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating Payment Link...
                      </>
                    ) : (
                      `Upgrade to ${plan.display_name}`
                    )}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Feature({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <Check className="h-4 w-4 text-green-600" />
      <span>{children}</span>
    </div>
  );
}
