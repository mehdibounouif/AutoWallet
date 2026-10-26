import type { ReactNode } from 'react'
import { cn } from '../../utils/cn'

export function PageHeader({ title, description, actions, id, className }: {
  title: ReactNode
  description?: ReactNode
  actions?: ReactNode
  id?: string
  className?: string
}) {
  return (
    <header className={cn('mb-6 flex flex-wrap items-end justify-between gap-x-5 gap-y-3', className)}>
      <div className="min-w-0">
        <h1 id={id} className="text-[28px] leading-tight font-extrabold tracking-[-0.035em] text-ink max-sm:text-[22px]">
          {title}
        </h1>
        {description && <p className="mt-2 text-[13px] leading-relaxed text-muted max-sm:mt-1.5 max-sm:text-xs">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </header>
  )
}

export function SectionHeader({ title, description, actions, id, className }: {
  title: ReactNode
  description?: ReactNode
  actions?: ReactNode
  id?: string
  className?: string
}) {
  return (
    <div className={cn('mb-4 flex flex-wrap items-baseline gap-x-3 gap-y-1', className)}>
      <h2 id={id} className="text-base font-extrabold text-ink">{title}</h2>
      {description && <p className="text-xs text-muted">{description}</p>}
      {actions && <div className="ms-auto flex items-center gap-3">{actions}</div>}
    </div>
  )
}
