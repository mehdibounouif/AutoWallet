import { cn } from '../../utils/cn'

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'danger-outline'
export type ButtonSize = 'sm' | 'md' | 'lg'

const variants: Record<ButtonVariant, string> = {
  primary: 'bg-action-primary text-white shadow-xs hover:bg-action-primary-hover active:bg-action-primary-pressed',
  secondary: 'bg-layer text-ink hover:bg-layer-strong',
  outline: 'border border-line-strong bg-surface text-ink hover:bg-canvas',
  ghost: 'text-muted hover:bg-canvas hover:text-ink',
  danger: 'bg-action-danger text-white hover:bg-action-danger-hover',
  'danger-outline': 'border border-action-danger bg-surface text-action-danger hover:bg-action-danger-subtle',
}

const sizes: Record<ButtonSize, string> = {
  sm: 'min-h-9 px-3 text-xs',
  md: 'min-h-10 px-3.5 text-[13px]',
  lg: 'h-11 px-4 text-sm sm:h-12',
}

export function buttonClass({ variant = 'primary', size = 'md', className }: {
  variant?: ButtonVariant
  size?: ButtonSize
  className?: string
} = {}) {
  return cn(
    'inline-flex shrink-0 items-center justify-center gap-2 rounded-control font-semibold whitespace-nowrap transition-colors',
    'disabled:cursor-not-allowed disabled:opacity-50',
    variants[variant],
    sizes[size],
    className,
  )
}

export const inputClass = cn(
  'block h-11 w-full rounded-control border border-line bg-surface px-3.5 text-sm text-ink outline-none transition',
  'placeholder:text-faint focus:border-action-primary focus:ring-2 focus:ring-action-primary/20',
  'aria-invalid:border-action-danger aria-invalid:ring-action-danger/15',
  'disabled:cursor-not-allowed disabled:bg-canvas disabled:text-subtle',
)

export const labelClass = 'block text-[13px] font-semibold text-ink'
