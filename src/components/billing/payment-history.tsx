import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getSubscriptionPaymentHistory, SubscriptionPayment } from '@/lib/subscription-actions';
import { format } from 'date-fns';
import { CheckCircle2, XCircle, History } from 'lucide-react';

type PaymentHistoryProps = {
  warehouseId: string;
};

export async function PaymentHistory({ warehouseId }: PaymentHistoryProps) {
  const payments = await getSubscriptionPaymentHistory(warehouseId);

  if (payments.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Payment History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-sm text-muted-foreground italic">
            <History className="h-4 w-4" />
            <span>No payment history yet</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Payment History</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {payments.slice(0, 5).map((payment) => (
            <PaymentItem key={payment.id} payment={payment} />
          ))}
          
          {payments.length > 5 && (
            <p className="text-xs text-muted-foreground text-center pt-2 border-t">
              Showing {5} of {payments.length} transactions
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function PaymentItem({ payment }: { payment: SubscriptionPayment }) {
  const isSuccess = payment.payment_status === 'success';
  const paymentDate = payment.payment_date 
    ? format(new Date(payment.payment_date), 'dd MMM yyyy')
    : 'Pending';

  return (
    <div className="flex items-center justify-between py-2 border-b last:border-0">
      <div className="flex items-center gap-3">
        {isSuccess ? (
          <CheckCircle2 className="h-4 w-4 text-green-600" />
        ) : (
          <XCircle className="h-4 w-4 text-red-600" />
        )}
        <div>
          <p className="text-sm font-medium">
            {payment.plans?.display_name || 'Unknown Plan'}
          </p>
          <p className="text-xs text-muted-foreground">
            {paymentDate}
            {payment.payment_method && ` • ${payment.payment_method.toUpperCase()}`}
          </p>
        </div>
      </div>
      <div className="text-right">
        <p className="text-sm font-semibold">
          ₹{payment.amount.toLocaleString('en-IN')}
        </p>
        <Badge 
          variant={isSuccess ? 'default' : 'destructive'}
          className="text-xs"
        >
          {payment.payment_status}
        </Badge>
      </div>
    </div>
  );
}
