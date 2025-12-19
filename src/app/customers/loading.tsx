import { TableSkeleton } from '@/components/ui/skeletons'
import { AppLayout } from '@/components/layout/app-layout'
import { PageHeader } from '@/components/shared/page-header'

export default function CustomersLoading() {
  return (
    <AppLayout>
      <PageHeader
        title="Customers"
        description="View and manage all your customers."
      />
      <div className="space-y-6">
        {/* Search skeleton */}
        <div className="h-10 w-64 bg-muted rounded animate-pulse" />
        
        {/* Table skeleton */}
        <TableSkeleton rows={10} columns={5} />
      </div>
    </AppLayout>
  )
}
