import type { ReactNode } from 'react'
import { cn } from '../../utils/cn'

export function EmptyState({ icon, title, description, action, bordered = true, className }: {
  icon?: ReactNode
  title: ReactNode
  description?: ReactNode
  action?: ReactNode
  bordered?: boolean
  className?: string
}) {
  return (
    <div
      className={cn(
        'flex min-h-[280px] flex-col items-center justify-center gap-3 px-6 py-10 text-center',
        bordered && 'rounded-card border border-line bg-surface',
        className,
      )}
    >
      {icon && <span className="text-line-strong [&>svg]:size-9" aria-hidden="true">{icon}</span>}
      <h2 className="text-lg font-extrabold text-ink">{title}</h2>
      {description && <p className="max-w-sm text-sm leading-relaxed text-muted">{description}</p>}
      {action}
    </div>
  )
}
