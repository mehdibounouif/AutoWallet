import { TextInput } from '../../../components/ui/TextInput'
import { BANK_ACCOUNT_INVALID } from '../../../content/messages'
import { useState } from 'react'
import { Info, AlertCircle } from 'lucide-react'
import { isValidBankAccountId } from '../../../auth/validation'

interface Step2AccountProps {
  bankAccount: string
  setBankAccount: (val: string) => void
  externalBankAccountError?: string | null
  disabled?: boolean
}

export function Step2Account({
  bankAccount,
  setBankAccount,
  externalBankAccountError,
  disabled = false,
}: Step2AccountProps) {
  const [touched, setTouched] = useState(false)

  const cleanAcc = bankAccount.trim()
  const isValidFormat = isValidBankAccountId(cleanAcc)
  const hasNonDigit = /\D/.test(cleanAcc)

  const error =
    externalBankAccountError ||
    (hasNonDigit || (touched && cleanAcc.length > 0 && !isValidFormat) ? BANK_ACCOUNT_INVALID : null)

  return (
    <div className="w-full max-w-[560px] bg-white rounded-2xl border border-border-subtle p-6 sm:p-9 shadow-[0_8px_24px_-4px_rgba(27,36,50,0.08),0_2px_6px_-1px_rgba(27,36,50,0.04)] transition-all">
      {/* Step Heading */}
      <div className="mb-6 space-y-1.5">
        <h1 className="text-2xl sm:text-[28px] font-semibold text-brand-ink tracking-tight">
          Where do your clients pay you?
        </h1>
        <p className="text-[15px] text-brand-muted leading-relaxed">
          Link the account your clients pay into, so each payment is split as it arrives.
        </p>
      </div>

      {/* Step 2: Link Account Form (Figma #117:1095) */}
      <div className="space-y-5">
        <div className="space-y-1.5">
          <label htmlFor="account-number-input" className="block text-sm font-medium text-brand-ink">
            Account number (RIB)
          </label>
          <TextInput appearance="auth"
            id="account-number-input"
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            required
            minLength={3}
            maxLength={50}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? 'account-number-error' : 'account-number-help'}
            disabled={disabled}
            autoFocus
            value={bankAccount}
            onBlur={() => setTouched(true)}
            onChange={(e) => {
              setBankAccount(e.target.value)
              if (isValidBankAccountId(e.target.value)) setTouched(false)
            }}
            placeholder="•••• •••• •••• 4821"
          />
          {error ? (
            <p id="account-number-error" role="alert" className="text-xs text-action-danger flex items-center gap-1.5 mt-1 animate-in fade-in">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{error}</span>
            </p>
          ) : (
            <p id="account-number-help" className="text-xs text-brand-muted leading-normal">We show only the last 4 digits. AutoWallet never moves money.</p>
          )}
        </div>

        {/* Informative Alert Banner (Figma #117:1109) */}
        <div className="p-3.5 sm:p-4 rounded-xl bg-action-primary-subtle border border-[#D0D6F5] text-brand-navy text-sm flex items-start gap-3">
          <Info className="w-5 h-5 text-action-primary shrink-0 mt-0.5" />
          <p className="leading-snug text-xs sm:text-sm">Create account saves this account ID with your AutoWallet profile. AutoWallet records payment splits but does not move money.</p>
        </div>
      </div>
    </div>
  )
}
