import { Card } from '../../../components/ui/Card'
import { Page } from '../../../components/ui/Page'
import { Skeleton } from '../../../components/ui/Skeleton'

export function EnvelopesSkeleton() {
  return (
    <Page as="section" aria-label="Loading envelopes" role="status">
      <div className="mb-6 space-y-3">
        <Skeleton className="h-7 w-[150px]" />
        <Skeleton className="h-3 w-[260px]" />
      </div>
      <Card className="grid min-h-[198px] gap-7 p-[22px] lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
        <div className="space-y-4">
          <Skeleton className="h-3 w-[105px]" />
          <Skeleton className="h-9 w-[195px]" />
          <Skeleton className="h-3 w-[80%]" />
        </div>
        <div className="space-y-3">
          <Skeleton className="h-[27px] w-full" />
          <Skeleton className="h-3 w-[80%]" />
          <Skeleton className="h-3 w-[80%]" />
        </div>
      </Card>
      <Skeleton className="mt-7 mb-3.5 h-3 w-[105px]" />
      <div className="grid gap-5 max-[980px]:gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }, (_, index) => (
          <Card key={index} className="min-h-[198px] space-y-4 p-5">
            <Skeleton className="h-3 w-[105px]" />
            <Skeleton className="h-9 w-[195px]" />
            <Skeleton className="h-3 w-[80%]" />
          </Card>
        ))}
      </div>
      <span className="sr-only">Loading envelopes</span>
    </Page>
  )
}
