import { FormSkeleton } from '@/components/ui/skeletons'
import { AppLayout } from '@/components/layout/app-layout'
import { PageHeader } from '@/components/shared/page-header'

export default function InflowLoading() {
  return (
    <AppLayout>
      <PageHeader
        title="Add Inflow"
        description="Create a new storage record for a customer."
      />
      <div className="space-y-6">
        <FormSkeleton />
        
        {/* Recent inflows skeleton */}
        <div className="space-y-4">
          <div className="h-6 w-32 bg-muted rounded animate-pulse" />
          <div className="rounded-md border p-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex gap-4 mb-3">
                <div className="h-8 w-24 bg-muted rounded animate-pulse" />
                <div className="h-8 w-20 bg-muted rounded animate-pulse" />
                <div className="h-8 flex-1 bg-muted rounded animate-pulse" />
                <div className="h-8 w-32 bg-muted rounded animate-pulse" />
                <div className="h-8 w-16 bg-muted rounded animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
