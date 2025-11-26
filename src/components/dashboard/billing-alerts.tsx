import type { StorageRecord } from "@/lib/definitions";
import { getRecordStatus } from "@/lib/billing";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, Info } from "lucide-react";
import { Button } from "../ui/button";

export function BillingAlerts({ records }: { records: StorageRecord[] }) {
  const alerts = records
    .map(record => ({ record, statusInfo: getRecordStatus(record) }))
    .filter(({ statusInfo }) => statusInfo.alert)
    .slice(0, 3); // Limit to 3 visible alerts

  if (alerts.length === 0) {
    return (
      <Alert className="bg-card">
        <Info className="h-4 w-4" />
        <AlertTitle>All Clear!</AlertTitle>
        <AlertDescription>
          No immediate billing actions are due.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      {alerts.map(({ record, statusInfo }) => (
        <Alert key={record.id} variant="destructive" className="bg-accent/20 border-accent/50 text-accent-foreground [&>svg]:text-accent">
            <AlertTriangle className="h-4 w-4 !text-amber-600" />
            <AlertTitle className="font-semibold text-amber-800">Action Required: {statusInfo.alert}</AlertTitle>
            <AlertDescription className="flex justify-between items-center text-amber-700">
                <span>Record ID: {record.id} ({record.commodityDescription}) requires attention.</span>
                <Button size="sm" variant="outline" className="bg-transparent border-amber-600 text-amber-800 hover:bg-amber-100 hover:text-amber-900">
                    Process Billing
                </Button>
            </AlertDescription>
        </Alert>
      ))}
    </div>
  );
}
