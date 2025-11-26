import { AppLayout } from "@/components/layout/app-layout";
import { PageHeader } from "@/components/shared/page-header";
import { AnomalyDetectionClient } from "@/components/anomaly/anomaly-detection-client";

export default function AnomalyDetectionPage() {
  return (
    <AppLayout>
      <PageHeader
        title="Anomaly Detection Tool"
        description="Use AI to analyze storage records for unusual patterns like extended durations or large quantities."
      />
      <div className="mt-8">
        <AnomalyDetectionClient />
      </div>
    </AppLayout>
  );
}
