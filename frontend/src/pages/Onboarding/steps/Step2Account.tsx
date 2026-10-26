import { useState } from 'react'
import { Info } from 'lucide-react'
import type { Translations } from '../../../i18n'
import { isValidBankAccountId } from '../../../auth/validation'
import { Alert } from '../../../components/ui/Alert'
import { Field, Input } from '../../../components/ui/Field'
import { FormCard, FormHeading } from '../../../components/ui/FormCard'

interface Step2AccountProps {
  bankAccount: string
  setBankAccount: (value: string) => void
  t: Translations
  externalBankAccountError?: string | null
  disabled?: boolean
}

export function Step2Account({ bankAccount, setBankAccount, t, externalBankAccountError, disabled = false }: Step2AccountProps) {
  const [touched, setTouched] = useState(false)
  const cleanAccount = bankAccount.trim()
  const isValidFormat = isValidBankAccountId(cleanAccount)
  const hasNonDigit = /\D/.test(cleanAccount)
  const error = externalBankAccountError ||
    (hasNonDigit || (touched && cleanAccount.length > 0 && !isValidFormat) ? t.bankAccountInvalid : null)

  return (
    <FormCard width="md">
      <FormHeading title={t.linkAccountTitle} description={t.linkAccountSubtitle} />
      <div className="space-y-5">
        <Field
          label={t.accountNumberLabel}
          htmlFor="account-number-input"
          error={error}
          hint={t.accountNumberHint}
        >
          <Input
            id="account-number-input"
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            required
            minLength={3}
            maxLength={50}
            aria-invalid={Boolean(error)}
            disabled={disabled}
            autoFocus
            value={bankAccount}
            onBlur={() => setTouched(true)}
            onChange={(event) => {
              setBankAccount(event.target.value)
              if (isValidBankAccountId(event.target.value)) setTouched(false)
            }}
            placeholder={t.accountNumberPlaceholder}
          />
        </Field>

        <Alert tone="brand" icon={<Info className="size-5" />}>
          <p className="text-xs leading-snug sm:text-sm">{t.linkAccountAlert}</p>
        </Alert>
      </div>
    </FormCard>
  )
}
