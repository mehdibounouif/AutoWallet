export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'danger' | 'danger-outline'
export type ControlAppearance = 'workspace' | 'auth'
export type ButtonAppearance = ControlAppearance | 'onboarding'

// Complete class names keep Tailwind's source detection reliable.
const buttonVariants: Record<ButtonVariant, string> = {
  primary: 'bg-action-primary text-white [&:not(:disabled):hover]:bg-action-primary-hover [&:not(:disabled):active]:bg-action-primary-pressed shadow-xs',
  secondary: 'bg-layer text-ink [&:not(:disabled):hover]:bg-layer-hover',
  outline: 'border border-field bg-transparent text-ink [&:not(:disabled):hover]:bg-layer',
  danger: 'border border-action-danger bg-action-danger text-white [&:not(:disabled):hover]:bg-action-danger-hover',
  'danger-outline': 'border border-action-danger bg-transparent text-danger [&:not(:disabled):hover]:bg-action-danger/5',
}

export function buttonStyles({ variant = 'primary', appearance = 'workspace', className = '' }: {
  variant?: ButtonVariant
  appearance?: ButtonAppearance
  className?: string
} = {}) {
  return [
    'inline-flex max-w-full min-w-0 items-center justify-center gap-2 transition-colors disabled:cursor-not-allowed disabled:opacity-50',
    appearance === 'auth'
      ? 'h-11 w-full rounded-[10px] px-4 text-sm font-medium sm:h-12'
      : appearance === 'onboarding'
        ? 'h-11 rounded-[10px] px-6 text-sm font-medium'
        : variant === 'primary' || variant === 'secondary'
          ? 'min-h-10 rounded-lg px-[15px] text-[13px] font-bold'
          : 'min-h-10 rounded-lg px-3.5 py-2 text-xs font-semibold',
    appearance === 'auth' && variant === 'secondary'
      ? 'bg-[#EDF0F4] text-brand-ink [&:not(:disabled):hover]:bg-[#E2E7ED]'
      : appearance === 'auth' && variant === 'outline'
        ? 'border border-border-subtle bg-white text-brand-ink [&:not(:disabled):hover]:bg-brand-surface [&:not(:disabled):active]:bg-[#EDF0F4] shadow-2xs'
        : buttonVariants[variant],
    className,
  ].join(' ')
}

export function inputStyles({ appearance = 'workspace', className = '' }: {
  appearance?: ControlAppearance
  className?: string
} = {}) {
  return [
    'block h-11 w-full min-w-0 max-w-full border text-sm font-normal outline-none transition-colors disabled:cursor-not-allowed',
    appearance === 'auth'
      ? 'rounded-[10px] border-border-subtle bg-white px-3.5 text-brand-ink placeholder:text-[#8C9BAE] focus:border-action-primary focus:ring-2 focus:ring-action-primary/20 aria-invalid:border-[#FFD2D2] aria-invalid:focus:border-action-danger aria-invalid:focus:ring-action-danger/20'
      : 'rounded-lg border-input bg-panel px-[13px] text-ink focus:border-action-primary focus:ring-[3px] focus:ring-action-primary/15 aria-invalid:border-action-danger',
    className,
  ].join(' ')
}

export const cardStyles = 'min-w-0 rounded-2xl border border-line bg-panel p-[22px] max-md:rounded-[13px] max-md:px-4 max-md:py-[19px] [&_h2]:text-base [&_h2]:font-[750] [&_h3]:text-base [&_h3]:font-[750]'
