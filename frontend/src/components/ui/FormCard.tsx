import type { ReactNode } from 'react'
import { cn } from '../../utils/cn'

const widths = {
  sm: 'max-w-[440px]',
  md: 'max-w-[560px]',
  lg: 'max-w-[680px]',
} as const

/** Centered form surface shared by auth and onboarding screens. */
export function FormCard({ width = 'sm', className, children }: {
  width?: keyof typeof widths
  className?: string
  children: ReactNode
}) {
  return (
    <div className={cn('w-full rounded-2xl border border-line bg-surface p-6 shadow-card transition sm:p-9', widths[width], className)}>
      {children}
    </div>
  )
}

export function FormHeading({ title, description, className }: {
  title: ReactNode
  description?: ReactNode
  className?: string
}) {
  return (
    <div className={cn('mb-6 space-y-1.5', className)}>
      <h1 className="text-2xl font-semibold tracking-tight text-ink sm:text-[28px]">{title}</h1>
      {description && <p className="text-[15px] leading-relaxed text-muted">{description}</p>}
    </div>
  )
}
