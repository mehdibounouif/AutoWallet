import { useRef } from 'react'
import { FlaskConical } from 'lucide-react'
import { useTranslation } from '../../i18n'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { AmountInput, Field, Input } from '../../components/ui/Field'

interface SandboxFormProps {
  amount: string
  reference: string
  invalid: boolean
  onAmountChange: (value: string) => void
  onReferenceChange: (value: string) => void
  onSubmit: () => void
}

/** Local-only form that starts a simulated payment preview. */
export function SandboxForm({ amount, reference, invalid, onAmountChange, onReferenceChange, onSubmit }: SandboxFormProps) {
  const { t } = useTranslation()
  const amountRef = useRef<HTMLInputElement>(null)

  return (
    <Card as="section" className="max-w-[900px] p-6">
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="text-base font-extrabold text-ink">{t.simulateClientHeading}</h2>
        <Badge tone="neutral" icon={<FlaskConical className="size-3.5" aria-hidden="true" />}>
          {t.testMoneyBadge}
        </Badge>
      </div>

      <form
        noValidate
        className="mt-6"
        onSubmit={(event) => {
          event.preventDefault()
          if (invalid) amountRef.current?.focus()
          onSubmit()
        }}
      >
        <div className="mb-5 grid grid-cols-2 gap-5 max-md:grid-cols-1 max-md:gap-[18px]">
          <Field
            label={t.amountMadInputLabel}
            htmlFor="sandbox-amount"
            error={invalid ? t.enterAmountAboveZero : null}
          >
            <AmountInput
              ref={amountRef}
              id="sandbox-amount"
              inputMode="decimal"
              aria-label="Amount (MAD)"
              value={amount}
              onChange={(event) => onAmountChange(event.target.value)}
              aria-invalid={invalid}
              className="font-semibold"
            />
          </Field>
          <Field
            label={<>{t.referenceOptionalLabel} <span className="text-xs font-normal text-subtle">{t.optionalWord}</span></>}
            htmlFor="sandbox-reference"
          >
            <Input
              id="sandbox-reference"
              value={reference}
              onChange={(event) => onReferenceChange(event.target.value)}
              maxLength={100}
              placeholder="TEST-001"
            />
          </Field>
        </div>
        <Button type="submit" icon={<FlaskConical className="size-4" aria-hidden="true" />} className="max-md:w-full">
          {t.simulatePaymentBtn}
        </Button>
        <p className="mt-3 text-xs leading-relaxed text-muted">{t.localSimNote}</p>
      </form>
    </Card>
  )
}
