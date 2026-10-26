import { CheckCircle2, FlaskConical } from 'lucide-react'
import type { Translations } from '../../../i18n'
import { money, parseAmount } from '../../../utils/format'
import { Alert } from '../../../components/ui/Alert'
import { Button } from '../../../components/ui/Button'
import { Card } from '../../../components/ui/Card'
import { AmountInput, Field } from '../../../components/ui/Field'
import { AllocationBreakdown } from './AllocationBreakdown'
import { PaymentPipe } from './PaymentPipe'
import { getAllocations } from './step5Model'

interface Props {
  simulatedAmount: string
  setSimulatedAmount: (value: string) => void
  rentAmount: string
  taxPercent: string
  savingsPercent: string
  savingsCap: string
  hasSimulated: boolean
  isSimulating: boolean
  onSimulate: () => void
  t: Translations
}

export function Step5TryPayment({
  simulatedAmount,
  setSimulatedAmount,
  rentAmount,
  taxPercent,
  savingsPercent,
  savingsCap,
  hasSimulated,
  isSimulating,
  onSimulate,
  t,
}: Props) {
  const amount = parseAmount(simulatedAmount)
  const validAmount = Number.isFinite(amount) && amount > 0
  const allocations = validAmount ? getAllocations(amount, rentAmount, taxPercent, savingsPercent, savingsCap, t) : []
  const total = allocations.reduce((sum, item) => sum + item.amount, 0)

  return (
    <div className="mx-auto w-full max-w-[1200px] animate-fade-in space-y-6">
      <div className="mx-auto max-w-[640px] space-y-2 pb-1.5 text-center">
        <h1 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">{t.tryPaymentTitle}</h1>
        <p className="text-sm leading-relaxed text-muted sm:text-base">{t.tryPaymentSubtitle}</p>
      </div>

      <div className="flex w-full flex-col items-center justify-center gap-3 sm:flex-row sm:items-end">
        <Field label={t.amountInputLabel} htmlFor="simulated-amount" className="w-full text-start sm:w-80">
          <AmountInput
            id="simulated-amount"
            value={simulatedAmount}
            onChange={(event) => setSimulatedAmount(event.target.value)}
            disabled={isSimulating}
            aria-invalid={Boolean(simulatedAmount) && !validAmount}
            className="h-11 border-line-strong text-base font-semibold focus:ring-[3px] focus:ring-action-primary/15"
          />
        </Field>
        <Button
          id={hasSimulated ? 'simulate-again-btn' : 'simulate-payment-btn'}
          size="lg"
          variant={hasSimulated ? 'secondary' : 'primary'}
          className="h-[52px] w-full shrink-0 rounded-xl sm:w-auto"
          onClick={onSimulate}
          disabled={isSimulating || !validAmount}
          loading={isSimulating}
          icon={<FlaskConical className="size-5" aria-hidden="true" />}
        >
          {isSimulating ? t.simulatingPayment : hasSimulated ? t.simulateAgainButton : t.simulatePaymentButton}
        </Button>
      </div>

      {hasSimulated && validAmount && (
        <>
          <Alert
            tone="success"
            role="status"
            className="mx-auto max-w-[640px]"
            icon={<CheckCircle2 className="size-5" />}
          >
            {t.splitSuccessAlert.replace('{amount}', money.format(amount))}
          </Alert>

          <Card className="animate-fade-in px-5 pt-11 pb-12 sm:px-8">
            <PaymentPipe amount={amount} allocations={allocations} t={t} />
            <AllocationBreakdown amount={amount} allocations={allocations} total={total} t={t} />
          </Card>
        </>
      )}
    </div>
  )
}
