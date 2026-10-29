import type { ComponentPropsWithRef, ReactNode } from 'react'
import { AlertCircle, ChevronDown, Eye, EyeOff } from 'lucide-react'
import { cn } from '../../utils/cn'
import { inputClass, labelClass } from './styles'

interface FieldProps {
  label: ReactNode
  htmlFor?: string
  hint?: ReactNode
  error?: string | null
  className?: string
  children: ReactNode
}

/** Label + control + hint/error with one consistent spacing rhythm. */
export function Field({ label, htmlFor, hint, error, className, children }: FieldProps) {
  return (
    <div className={cn('space-y-2', className)}>
      <label htmlFor={htmlFor} className={labelClass}>{label}</label>
      {children}
      {error ? (
        <p className="flex items-start gap-1.5 text-xs font-medium text-action-danger" role="alert">
          <AlertCircle className="mt-px size-3.5 shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </p>
      ) : hint ? (
        <p className="text-xs leading-relaxed font-normal text-muted">{hint}</p>
      ) : null}
    </div>
  )
}

export function Input({ className, ...rest }: ComponentPropsWithRef<'input'>) {
  return <input className={cn(inputClass, className)} {...rest} />
}

export function Textarea({ className, ...rest }: ComponentPropsWithRef<'textarea'>) {
  return <textarea className={cn(inputClass, 'h-auto min-h-24 resize-y py-2.5', className)} {...rest} />
}

export function Select({ className, children, ...rest }: ComponentPropsWithRef<'select'>) {
  return (
    <span className="relative block">
      <select className={cn(inputClass, 'appearance-none pr-9', className)} {...rest}>
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute end-3 top-1/2 size-4 -translate-y-1/2 text-muted" aria-hidden="true" />
    </span>
  )
}

interface RevealInputProps extends ComponentPropsWithRef<'input'> {
  revealed: boolean
  onToggleReveal: () => void
  toggleLabel: string
}

/** Password/secret input with an accessible show-hide control. */
export function RevealInput({ revealed, onToggleReveal, toggleLabel, className, ...rest }: RevealInputProps) {
  return (
    <span className="relative block">
      <input type={revealed ? 'text' : 'password'} className={cn(inputClass, 'pr-11', className)} {...rest} />
      <button
        type="button"
        onClick={onToggleReveal}
        aria-label={toggleLabel}
        className="absolute end-1.5 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-md text-muted hover:text-ink"
      >
        {revealed ? <EyeOff className="size-4" aria-hidden="true" /> : <Eye className="size-4" aria-hidden="true" />}
      </button>
    </span>
  )
}

/** Amount input with a trailing currency/suffix label. */
export function AmountInput({ suffix = 'MAD', className, ...rest }: ComponentPropsWithRef<'input'> & { suffix?: string }) {
  return (
    <span className="relative block">
      <input className={cn(inputClass, 'pr-14 font-semibold', className)} {...rest} />
      <span className="pointer-events-none absolute end-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-muted">
        {suffix}
      </span>
    </span>
  )
}
