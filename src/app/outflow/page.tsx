
import { AppLayout } from "@/components/layout/app-layout";
import { PageHeader } from "@/components/shared/page-header";

export default function OutflowPage() {
  return (
    <AppLayout>
      <PageHeader
        title="Process Outflow"
        description="This feature is currently being rebuilt."
      />
      <div className="flex items-center justify-center h-48 bg-muted rounded-lg">
        <p className="text-muted-foreground">Coming soon...</p>
      </div>
    </AppLayout>
  );
}
