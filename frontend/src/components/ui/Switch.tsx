import type { ReactNode } from 'react'
import { cn } from '../../utils/cn'

interface SwitchProps {
  checked: boolean
  onChange: (checked: boolean) => void
  label?: ReactNode
  disabled?: boolean
  className?: string
  'aria-label'?: string
}

/** Checkbox-backed toggle: native semantics, Tailwind-only visuals. */
export function Switch({ checked, onChange, label, disabled, className, 'aria-label': ariaLabel }: SwitchProps) {
  return (
    <label className={cn('inline-flex cursor-pointer items-center gap-2 text-xs font-semibold text-muted', disabled && 'cursor-not-allowed opacity-60', className)}>
      <input
        type="checkbox"
        className="peer sr-only"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
        aria-label={ariaLabel}
      />
      <span
        aria-hidden="true"
        className={cn(
          "relative h-[23px] w-[43px] shrink-0 rounded-full bg-line-strong transition-colors after:absolute after:left-0.5 after:top-0.5 after:size-[19px] after:rounded-full after:bg-white after:shadow-sm after:transition-transform after:content-['']",
          'peer-checked:bg-action-primary peer-checked:after:translate-x-5',
          'peer-focus-visible:ring-2 peer-focus-visible:ring-action-primary peer-focus-visible:ring-offset-2',
        )}
      />
      {label && <span>{label}</span>}
    </label>
  )
}
