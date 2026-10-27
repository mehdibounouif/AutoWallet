import { cn } from '../../utils/cn'

export function Skeleton({ className }: { className?: string }) {
  return <span className={cn('block animate-shimmer rounded-md bg-layer-strong', className)} aria-hidden="true" />
}
