import { Check, Minus } from 'lucide-react'
import type { Translations } from '../../i18n'
import { cn } from '../../utils/cn'

interface PasswordStrengthProps {
  password: string
  t: Translations
  className?: string
}

function scorePassword(value: string) {
  if (!value) return 0
  let score = 0
  if (value.length >= 8) score += 1
  if (/[A-Z]/.test(value) && /[a-z]/.test(value)) score += 1
  if (/\d/.test(value)) score += 1
  if (/[^A-Za-z0-9]/.test(value) || value.length >= 12) score += 1
  return score
}

// The inactive segment stays literal: its exact class is asserted by the QA meter test.
const segmentColors = ['bg-[#DDE3EA]', 'bg-action-danger', 'bg-tax-solid', 'bg-warning', 'bg-savings-solid']
const labelColors = ['text-muted', 'text-action-danger', 'text-tax-solid', 'text-warning', 'text-savings-solid']

/** Four-segment password meter shared by signup, reset and security settings. */
export function PasswordStrength({ password, t, className = 'pt-1.5' }: PasswordStrengthProps) {
  const score = scorePassword(password)
  const labels = [t.pwStrengthWeak, t.pwStrengthFair, t.pwStrengthGood, t.pwStrengthStrong]
  const label = score > 0 ? labels[score - 1] : ''

  return (
    <div className={cn(className, 'space-y-2')}>
      <div className="grid h-1 w-full grid-cols-4 gap-1.5" aria-hidden="true">
        {[1, 2, 3, 4].map((step) => (
          <div
            key={step}
            className={cn('h-full rounded-full transition-colors duration-200', score >= step ? segmentColors[score] : 'bg-[#DDE3EA]')}
          />
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted">
        <div className="flex items-center gap-1.5">
          {password.length >= 8
            ? <Check className="size-3.5 text-savings-solid" aria-hidden="true" />
            : <Minus className="size-3.5 text-muted" aria-hidden="true" />}
          <span className={password.length >= 8 ? 'font-medium text-ink' : 'text-muted'}>{t.pwRequirement}</span>
        </div>
        {password.length > 0 && <span className={cn('font-semibold', labelColors[score])}>{label}</span>}
      </div>
    </div>
  )
}
