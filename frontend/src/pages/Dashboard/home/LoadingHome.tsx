import { Skeleton } from '../../../components/ui/Skeleton'

export function LoadingHome() {
  return (
    <div className="animate-pulse space-y-8" role="status" aria-label="Loading dashboard">
      <Skeleton className="h-8 w-60" />
      <div className="grid gap-8 md:grid-cols-2">
        <div className="space-y-4">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-14 w-56" />
          <Skeleton className="h-4 w-72" />
        </div>
        <div className="space-y-4">
          {[1, 2, 3, 4].map((item) => <Skeleton key={item} className="h-16" />)}
        </div>
      </div>
      <Skeleton className="h-64" />
      <Skeleton className="h-56 rounded-xl bg-surface" />
      <span className="sr-only">Loading dashboard data</span>
    </div>
  )
}
