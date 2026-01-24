import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="flex min-h-screen w-full flex-col">
       {/* Mock Header */}
       <header className="sticky top-0 flex h-16 items-center border-b bg-card px-4 md:px-6">
          <div className="h-6 w-6 bg-muted rounded-full mr-4" />
          <div className="h-4 w-32 bg-muted rounded" />
       </header>

       {/* Safe Skeleton Content */}
       <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
          <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <Skeleton className="h-10 w-48" />
              <Skeleton className="h-10 w-24" />
            </div>
            <div className="grid gap-6 md:grid-cols-3">
                <Skeleton className="h-40 rounded-xl" />
                <Skeleton className="h-40 rounded-xl" />
                <Skeleton className="h-40 rounded-xl" />
            </div>
            <Skeleton className="h-[400px] w-full rounded-xl" />
          </div>
       </main>
    </div>
  );
}
