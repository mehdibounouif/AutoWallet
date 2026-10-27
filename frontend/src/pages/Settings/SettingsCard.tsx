import type { ReactNode } from 'react'
import { Card } from '../../components/ui/Card'
import { cn } from '../../utils/cn'

/** Card with the settings page's consistent heading/description rhythm. */
export function SettingsCard({ title, description, action, children, className }: {
  title: ReactNode
  description?: ReactNode
  action?: ReactNode
  children?: ReactNode
  className?: string
}) {
  return (
    <Card as="section" className={cn('p-5 sm:p-6', className)}>
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="text-base font-extrabold text-ink">{title}</h2>
        {action}
      </div>
      {description && <p className="mt-2.5 text-[13px] leading-relaxed text-muted">{description}</p>}
      {children}
    </Card>
  )
}

export function SettingsForm({ children, className, onSubmit, noValidate }: {
  children: ReactNode
  className?: string
  onSubmit?: (event: React.FormEvent<HTMLFormElement>) => void
  noValidate?: boolean
}) {
  return (
    <form className={cn('mt-5 grid max-w-[640px] gap-4', className)} onSubmit={onSubmit} noValidate={noValidate}>
      {children}
    </form>
  )
}
