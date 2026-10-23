import { PASSWORD_REQUIREMENT } from '../../content/messages'
import { Check, Minus } from 'lucide-react'

interface PasswordStrengthProps {
  password: string
  className?: string
}

export function PasswordStrength({ password, className = 'pt-1.5' }: PasswordStrengthProps) {
  // Password strength calculation (0 to 4)
  const calculatePasswordStrength = (pwd: string): number => {
    if (!pwd) return 0
    let score = 0
    if (pwd.length >= 8) score += 1
    if (/[A-Z]/.test(pwd) && /[a-z]/.test(pwd)) score += 1
    if (/\d/.test(pwd)) score += 1
    if (/[^A-Za-z0-9]/.test(pwd) || pwd.length >= 12) score += 1
    return score
  }

  const pwStrength = calculatePasswordStrength(password)

  // Password strength text & color (matching Figma A2)
  const getStrengthMeta = () => {
    switch (pwStrength) {
      case 2:
        return { label: "Fair", color: 'bg-tax-solid', text: 'text-tax-solid' }
      case 3:
        return { label: "Good", color: 'bg-free-solid', text: 'text-free-solid' }
      case 4:
        return { label: "Strong.", color: 'bg-savings-solid', text: 'text-savings-solid' }
      case 1:
        return { label: "Weak", color: 'bg-action-danger', text: 'text-action-danger' }
      default:
        return { label: '', color: 'bg-border-subtle', text: 'text-brand-muted' }
    }
  }

  const strengthMeta = getStrengthMeta()

  return (
    <div className={`${className} space-y-2`}>
      {/* 4-segment progress bar */}
      <div className="grid grid-cols-4 gap-1.5 h-1 w-full" aria-hidden="true">
        {[1, 2, 3, 4].map((step) => (
          <div
            key={step}
            className={`h-full rounded-full transition-colors duration-200 ${
              pwStrength >= step ? strengthMeta.color : 'bg-[#DDE3EA]'
            }`}
          />
        ))}
      </div>

      {/* Requirement & Status */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-brand-muted">
        <div className="flex items-center gap-1.5">
          {password.length >= 8 ? (
            <Check className="w-3.5 h-3.5 text-savings-solid" />
          ) : (
            <Minus className="w-3.5 h-3.5 text-brand-muted" />
          )}
          <span className={password.length >= 8 ? 'text-brand-ink font-medium' : 'text-brand-muted'}>
            {PASSWORD_REQUIREMENT}
          </span>
        </div>
        {password.length > 0 && (
          <span className={`font-semibold ${strengthMeta.text}`}>{strengthMeta.label}</span>
        )}
      </div>
    </div>
  )
}
