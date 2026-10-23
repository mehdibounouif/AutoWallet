import { TextInput } from '../../../components/ui/TextInput'
import { FULL_NAME_TOO_LONG, FIRST_NAME_REQUIRED, LAST_NAME_REQUIRED } from '../../../content/messages'
import { isValidFullNameLength } from '../../../auth/validation'
import { useState } from 'react'
import type { FormEvent } from 'react'
import { AlertCircle } from 'lucide-react'

interface Step1AboutProps {
  firstName: string
  setFirstName: (val: string) => void
  lastName: string
  setLastName: (val: string) => void
  onSubmit: (e?: FormEvent) => void
  externalFirstNameError?: string | null
  externalLastNameError?: string | null
}

export function Step1About({
  firstName,
  setFirstName,
  lastName,
  setLastName,
  onSubmit,
  externalFirstNameError,
  externalLastNameError,
}: Step1AboutProps) {
  const [firstNameTouched, setFirstNameTouched] = useState(false)
  const [lastNameTouched, setLastNameTouched] = useState(false)

  // Local verification checks
  const isFirstNameValid = firstName.trim().length >= 2
  const isLastNameValid = lastName.trim().length >= 2

  const nameTooLong = !isValidFullNameLength(firstName, lastName)
  const firstNameError =
    (nameTooLong ? FULL_NAME_TOO_LONG : null) ||
    externalFirstNameError ||
    (firstNameTouched && !isFirstNameValid ? FIRST_NAME_REQUIRED : null)

  const lastNameError =
    (nameTooLong ? FULL_NAME_TOO_LONG : null) ||
    externalLastNameError ||
    (lastNameTouched && !isLastNameValid ? LAST_NAME_REQUIRED : null)

  return (
    <div className="w-full max-w-[560px] bg-white rounded-2xl border border-border-subtle p-6 sm:p-9 shadow-[0_8px_24px_-4px_rgba(27,36,50,0.08),0_2px_6px_-1px_rgba(27,36,50,0.04)] transition-all">
      {/* Step Heading */}
      <div className="mb-6 space-y-1.5">
        <h1 className="text-2xl sm:text-[28px] font-semibold text-brand-ink tracking-tight">
          What should we call you?
        </h1>
        <p className="text-[15px] text-brand-muted leading-relaxed">
          We use your first name on Home and your full name on your account.
        </p>
      </div>

      {/* Step 1: About You Form (Figma #117:1008) */}
      <form onSubmit={onSubmit} className="space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* First Name Field */}
          <div className="space-y-1.5">
            <label htmlFor="first-name-input" className="block text-sm font-medium text-brand-ink">
              First name
            </label>
            <TextInput appearance="auth"
              id="first-name-input"
              autoComplete="given-name"
              type="text"
              required
              autoFocus
              value={firstName}
              aria-invalid={Boolean(firstNameError)}
              aria-describedby={firstNameError ? 'first-name-error' : undefined}
              onBlur={() => setFirstNameTouched(true)}
              onChange={(e) => {
                setFirstName(e.target.value)
                if (firstNameTouched && e.target.value.trim().length >= 2) {
                  setFirstNameTouched(false)
                }
              }}
            />
            {firstNameError && (
              <p id="first-name-error" role="alert" className="text-xs text-action-danger flex items-center gap-1.5 mt-1 animate-in fade-in">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{firstNameError}</span>
              </p>
            )}
          </div>

          {/* Last Name Field */}
          <div className="space-y-1.5">
            <label htmlFor="last-name-input" className="block text-sm font-medium text-brand-ink">
              Last name
            </label>
            <TextInput appearance="auth"
              id="last-name-input"
              autoComplete="family-name"
              type="text"
              required
              value={lastName}
              aria-invalid={Boolean(lastNameError)}
              aria-describedby={lastNameError ? 'last-name-error' : undefined}
              onBlur={() => setLastNameTouched(true)}
              onChange={(e) => {
                setLastName(e.target.value)
                if (lastNameTouched && e.target.value.trim().length >= 2) {
                  setLastNameTouched(false)
                }
              }}
            />
            {lastNameError && (
              <p id="last-name-error" role="alert" className="text-xs text-action-danger flex items-center gap-1.5 mt-1 animate-in fade-in">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{lastNameError}</span>
              </p>
            )}
          </div>
        </div>

      </form>
    </div>
  )
}
