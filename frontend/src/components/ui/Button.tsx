import type { ComponentPropsWithRef, ReactNode } from 'react'
import { Loader2 } from 'lucide-react'
import { cn } from '../../utils/cn'
import { buttonClass } from './styles'
import type { ButtonSize, ButtonVariant } from './styles'

interface ButtonProps extends ComponentPropsWithRef<'button'> {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
  icon?: ReactNode
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  className,
  children,
  disabled,
  type = 'button',
  ...rest
}: ButtonProps) {
  return (
    <button type={type} className={buttonClass({ variant, size, className })} disabled={disabled || loading} {...rest}>
      {loading ? <Loader2 className="size-4 shrink-0 animate-spin" aria-hidden="true" /> : icon}
      {children}
    </button>
  )
}

interface IconButtonProps extends ComponentPropsWithRef<'button'> {
  label: string
  tone?: 'default' | 'danger'
  size?: 'sm' | 'md'
}

export function IconButton({ label, tone = 'default', size = 'md', className, children, type = 'button', ...rest }: IconButtonProps) {
  return (
    <button
      type={type}
      aria-label={label}
      className={cn(
        'inline-flex items-center justify-center rounded-lg transition-colors disabled:cursor-not-allowed disabled:opacity-50',
        size === 'sm' ? 'size-7' : 'size-9',
        tone === 'danger' ? 'text-muted hover:bg-action-danger-subtle hover:text-action-danger' : 'text-muted hover:bg-canvas hover:text-ink',
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  )
}
