import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardHeader, CardContent } from "@/components/ui/card";

export default function DashboardLoading() {
  return (
    <div className="space-y-8 animate-in fade-in-50">
      
      {/* 1. Hero Section Skeleton */}
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="p-6">
           <div className="space-y-4">
              <Skeleton className="h-8 w-1/3" />
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                 <Skeleton className="h-20 w-full" />
                 <Skeleton className="h-20 w-full" />
                 <Skeleton className="h-20 w-full" />
                 <Skeleton className="h-20 w-full" />
              </div>
           </div>
        </CardContent>
      </Card>

      {/* 2. Shortcuts Skeleton */}
      <div className="flex gap-4 overflow-x-auto pb-2">
         {[1, 2, 3, 4].map(i => (
             <Skeleton key={i} className="h-12 w-32 flex-shrink-0" />
         ))}
      </div>

      {/* 3. Metric Cards Skeleton */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-3/4 mb-1" />
              <Skeleton className="h-3 w-1/2" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 4. Market Prices Skeleton */}
      <Card>
          <CardHeader>
             <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent>
             <div className="space-y-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
             </div>
          </CardContent>
      </Card>

      {/* 5. Recent Activity Skeleton */}
      <div className="space-y-4">
        <Skeleton className="h-6 w-32" />
        <div className="space-y-2">
            {[1, 2, 3, 4, 5].map(i => (
                <Skeleton key={i} className="h-16 w-full rounded-lg" />
            ))}
        </div>
      </div>
      
    </div>
  );
}
