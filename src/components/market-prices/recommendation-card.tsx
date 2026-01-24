'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { TrendingUp, TrendingDown, Eye, AlertCircle, CheckCircle2, Clock } from 'lucide-react';

type RecommendationAction = 'SELL_NOW' | 'SELL_SOON' | 'HOLD' | 'MONITOR';
type Confidence = 'HIGH' | 'MEDIUM' | 'LOW';

interface RecommendationCardProps {
  action: RecommendationAction;
  confidence: Confidence;
  reason: string;
  details: {
    current: number | null;
    average: number | null;
    trend: 'rising' | 'falling' | 'stable';
    change_percent: number | null;
  } | null;
}

export function RecommendationCard({ action, confidence, reason, details }: RecommendationCardProps) {
  const getActionConfig = () => {
    switch (action) {
      case 'SELL_NOW':
        return {
          icon: <TrendingDown className="h-6 w-6" />,
          title: 'Sell Now',
          color: 'bg-rose-500',
          textColor: 'text-rose-600',
          bgColor: 'bg-rose-50 dark:bg-rose-950',
          borderColor: 'border-rose-200 dark:border-rose-800',
        };
      case 'SELL_SOON':
        return {
          icon: <Clock className="h-6 w-6" />,
          title: 'Sell Soon',
          color: 'bg-orange-500',
          textColor: 'text-orange-600',
          bgColor: 'bg-orange-50 dark:bg-orange-950',
          borderColor: 'border-orange-200 dark:border-orange-800',
        };
      case 'HOLD':
        return {
          icon: <CheckCircle2 className="h-6 w-6" />,
          title: 'Hold',
          color: 'bg-emerald-500',
          textColor: 'text-emerald-600',
          bgColor: 'bg-emerald-50 dark:bg-emerald-950',
          borderColor: 'border-emerald-200 dark:border-emerald-800',
        };
      case 'MONITOR':
        return {
          icon: <Eye className="h-6 w-6" />,
          title: 'Monitor',
          color: 'bg-slate-500',
          textColor: 'text-slate-600',
          bgColor: 'bg-slate-50 dark:bg-slate-950',
          borderColor: 'border-slate-200 dark:border-slate-800',
        };
    }
  };

  const getConfidenceBadge = () => {
    const variants: Record<Confidence, { variant: 'default' | 'secondary' | 'outline'; label: string }> = {
      HIGH: { variant: 'default', label: 'High Confidence' },
      MEDIUM: { variant: 'secondary', label: 'Medium Confidence' },
      LOW: { variant: 'outline', label: 'Low Confidence' },
    };
    return variants[confidence];
  };

  const config = getActionConfig();
  const confidenceBadge = getConfidenceBadge();

  return (
    <Card className={`border-2 ${config.borderColor}`}>
      <CardHeader className={config.bgColor}>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={`${config.color} text-white p-3 rounded-lg`}>
              {config.icon}
            </div>
            <div>
              <CardTitle className={`text-xl ${config.textColor}`}>
                🎯 Recommendation: {config.title}
              </CardTitle>
              <Badge variant={confidenceBadge.variant} className="mt-1">
                {confidenceBadge.label}
              </Badge>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-6 space-y-4">
        {/* Reason */}
        <Alert className={config.bgColor}>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-sm">
            <strong>Why:</strong> {reason}
          </AlertDescription>
        </Alert>

        {/* Price Details */}
        {details && details.current && details.average && (
          <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
            <div>
              <p className="text-xs text-muted-foreground">Current Price</p>
              <p className="text-lg font-bold tabular-nums">
                ₹{details.current.toLocaleString('en-IN')}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">30-Day Average</p>
              <p className="text-lg font-bold tabular-nums">
                ₹{details.average.toLocaleString('en-IN')}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Trend</p>
              <div className="flex items-center gap-1">
                {details.trend === 'rising' && (
                  <>
                    <TrendingUp className="h-4 w-4 text-emerald-500" />
                    <span className="text-sm font-medium text-emerald-600">Rising</span>
                  </>
                )}
                {details.trend === 'falling' && (
                  <>
                    <TrendingDown className="h-4 w-4 text-rose-500" />
                    <span className="text-sm font-medium text-rose-600">Falling</span>
                  </>
                )}
                {details.trend === 'stable' && (
                  <span className="text-sm font-medium text-slate-600">Stable</span>
                )}
              </div>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Change</p>
              <p className={`text-lg font-bold tabular-nums ${
                details.change_percent && details.change_percent > 0 
                  ? 'text-emerald-600' 
                  : 'text-rose-600'
              }`}>
                {details.change_percent !== null 
                  ? `${details.change_percent > 0 ? '+' : ''}${details.change_percent.toFixed(1)}%`
                  : 'N/A'}
              </p>
            </div>
          </div>
        )}

        {/* Action Guidance */}
        <div className="pt-2 border-t">
          <p className="text-sm text-muted-foreground">
            {action === 'SELL_NOW' && (
              <>
                <strong>Suggested Action:</strong> Consider selling within the next 3-5 days to maximize returns.
              </>
            )}
            {action === 'SELL_SOON' && (
              <>
                <strong>Suggested Action:</strong> Good time to sell if you need liquidity. Monitor for next 7 days.
              </>
            )}
            {action === 'HOLD' && (
              <>
                <strong>Suggested Action:</strong> Wait for better prices. Monitor daily for trend changes.
              </>
            )}
            {action === 'MONITOR' && (
              <>
                <strong>Suggested Action:</strong> Keep watching the market. No urgent action needed.
              </>
            )}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
