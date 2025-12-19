import { TableSkeleton } from '@/components/ui/skeletons'
import { AppLayout } from '@/components/layout/app-layout'
import { PageHeader } from '@/components/shared/page-header'

export default function StorageLoading() {
  return (
    <AppLayout>
      <PageHeader
        title="Storage Overview"
        description="A high-level summary of your warehouse inventory."
      />
      <div className="space-y-6">
        {/* Stats skeleton */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="rounded-lg border bg-card p-6">
              <div className="h-4 w-24 bg-muted rounded mb-2 animate-pulse" />
              <div className="h-8 w-32 bg-muted rounded animate-pulse" />
            </div>
          ))}
        </div>
        
        {/* Table skeleton */}
        <TableSkeleton rows={10} columns={7} />
      </div>
    </AppLayout>
  )
}
