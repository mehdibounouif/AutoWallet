import { cn } from '../../utils/cn'

export function ProgressBar({ value, color, label, className, trackClassName }: {
  value: number
  color?: string
  label: string
  className?: string
  trackClassName?: string
}) {
  const percent = Math.max(0, Math.min(100, Math.round(value)))
  return (
    <div
      className={cn('h-1 overflow-hidden rounded-full bg-layer-strong', trackClassName, className)}
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={percent}
    >
      <span
        className="block h-full rounded-full transition-[width]"
        style={{ width: `${percent}%`, backgroundColor: color }}
      />
    </div>
  )
}
