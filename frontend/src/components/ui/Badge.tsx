import type { ReactNode } from 'react'
import { cn } from '../../utils/cn'

export type BadgeTone = 'neutral' | 'brand' | 'success' | 'warning' | 'danger' | 'info'

const tones: Record<BadgeTone, string> = {
  neutral: 'bg-layer text-muted',
  brand: 'bg-selected text-accent',
  success: 'bg-success-soft text-success-ink',
  warning: 'bg-warning-soft text-warning-ink',
  danger: 'bg-action-danger-subtle text-action-danger',
  info: 'bg-info-soft text-info-ink',
}

export function Badge({ tone = 'neutral', icon, className, children }: {
  tone?: BadgeTone
  icon?: ReactNode
  className?: string
  children: ReactNode
}) {
  return (
    <span className={cn('inline-flex w-fit items-center gap-1 rounded-full px-2 py-0.5 text-2xs font-bold whitespace-nowrap', tones[tone], className)}>
      {icon}
      {children}
    </span>
  )
}
