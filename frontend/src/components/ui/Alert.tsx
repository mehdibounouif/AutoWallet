import type { ReactNode } from 'react'
import { cn } from '../../utils/cn'

export type AlertTone = 'info' | 'brand' | 'success' | 'warning' | 'danger' | 'neutral'

const tones: Record<AlertTone, string> = {
  info: 'bg-info-soft text-info-ink',
  brand: 'bg-selected text-brand-navy',
  success: 'bg-success-soft text-success-ink',
  warning: 'bg-warning-soft text-warning-ink',
  danger: 'bg-action-danger-subtle text-action-danger',
  neutral: 'bg-layer text-body',
}

export function Alert({ tone = 'info', icon, action, className, children, role }: {
  tone?: AlertTone
  icon?: ReactNode
  action?: ReactNode
  className?: string
  children: ReactNode
  role?: 'alert' | 'status' | 'note'
}) {
  return (
    <div
      role={role ?? (tone === 'danger' ? 'alert' : 'status')}
      className={cn('flex items-start gap-3 rounded-xl px-3.5 py-3 text-sm leading-snug', tones[tone], className)}
    >
      {icon && <span className="mt-0.5 shrink-0">{icon}</span>}
      <div className="min-w-0 flex-1">{children}</div>
      {action}
    </div>
  )
}
