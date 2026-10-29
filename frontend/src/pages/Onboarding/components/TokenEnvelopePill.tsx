import type { ComponentType } from 'react'
import { cn } from '../../../utils/cn'

interface TokenEnvelopePillProps {
  name: string
  icon: ComponentType<{ className?: string }>
  color: string
  bgColor: string
  className?: string
}

/** Envelope token shown inline in the onboarding rule sentences. */
export function TokenEnvelopePill({ name, icon: Icon, color, bgColor, className }: TokenEnvelopePillProps) {
  return (
    <span className={cn('my-1 inline-flex h-9 min-h-9 items-center gap-1.5 rounded-control border border-line bg-surface px-3 align-middle text-sm font-semibold text-ink shadow-xs select-none', className)}>
      <span className="grid size-5 shrink-0 place-items-center rounded-md" style={{ backgroundColor: bgColor, color }}>
        <Icon className="size-3.5" />
      </span>
      <span>{name}</span>
    </span>
  )
}
