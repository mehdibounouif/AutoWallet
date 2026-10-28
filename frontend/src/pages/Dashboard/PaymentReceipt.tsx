import { Check } from 'lucide-react'
import type { PreviewStep, SplitAmounts } from './dashboardSplit'
import { envelopeMeta, money, ruleDescription, walletOrder } from './envelopeDisplay'
import { useTranslation } from '../../i18n'
import { Card } from '../../components/ui/Card'

interface PaymentReceiptProps {
  amount: number
  allocations: SplitAmounts
  reference: string
  steps?: PreviewStep[]
}

/** One receipt layout for recorded splits and sandbox/onboarding previews. */
export function PaymentReceipt({ amount, allocations, reference, steps }: PaymentReceiptProps) {
  const { t } = useTranslation()
  return (
    <Card as="section" aria-label="Payment receipt" className="p-5 sm:p-6">
      <h2 className="text-base font-extrabold text-ink">{t.totalLabel}</h2>
      <div className="mt-7 flex flex-wrap items-baseline justify-between gap-3.5 border-b border-line pb-3.5 text-sm">
        <strong className="min-w-0 font-bold text-ink break-words">{reference}</strong>
        <strong className="font-bold text-ink tabular-nums break-words">
          {money.format(amount)} <small className="text-2xs font-semibold text-muted">MAD</small>
        </strong>
      </div>

      {steps
        ? steps.map(({ rule, allocated, remaining, reason }, index) => (
            <div
              key={rule.id}
              className="grid grid-cols-[18px_minmax(120px,1fr)_minmax(80px,auto)_minmax(70px,auto)] items-start gap-3 border-b border-line py-4 text-xs max-md:grid-cols-[18px_minmax(0,1fr)_auto] max-md:gap-2"
            >
              <span className="font-semibold text-muted">{index + 1}</span>
              <div className="min-w-0">
                <strong className="font-bold text-ink">{rule.name}</strong>
                <p className="mt-1 text-2xs leading-relaxed text-muted break-words">{reason ?? ruleDescription(rule)}</p>
                <span className="mt-1.5 inline-block rounded-full bg-layer px-1.5 py-0.5 text-3xs text-muted">
                  {rule.rule_type === 'lock_fixed' ? t.fixedAmountType : `${rule.percentage ?? 0}% ${t.percentOfLeftType}`}
                </span>{' '}
                <span className={`inline-flex items-center gap-1 text-2xs ${reason ? 'text-subtle' : 'text-success-ink'}`}>
                  {reason ? t.skippedStatusBadge : <><Check className="size-3.5" aria-hidden="true" />{t.ranStatusBadge}</>}
                </span>
              </div>
              <strong className="text-end font-semibold text-ink tabular-nums break-words">{money.format(allocated)}</strong>
              <span className="text-end text-2xs text-muted tabular-nums break-words">{money.format(remaining)} {t.leftText}</span>
            </div>
          ))
        : walletOrder
            .filter((type) => type !== 'main' && allocations[type] > 0)
            .map((type) => {
              const { icon: Icon, name, color } = envelopeMeta[type]
              return (
                <div key={type} className="grid grid-cols-[18px_minmax(0,1fr)_auto] items-center gap-3 border-b border-line py-4 text-xs">
                  <span style={{ color }}><Icon className="size-[18px]" aria-hidden="true" /></span>
                  <div className="min-w-0">
                    <strong className="font-bold text-ink">{name}</strong>
                    <p className="mt-1 text-2xs text-muted">Recorded allocation</p>
                  </div>
                  <strong className="text-end font-semibold text-ink tabular-nums">{money.format(allocations[type])}</strong>
                </div>
              )
            })}

      <div className="flex justify-between gap-3 pt-4 pb-4 text-xs text-muted">
        <span>{t.leftoverToMainLabel}</span>
        <strong className="font-semibold text-ink tabular-nums">{money.format(allocations.main)}</strong>
      </div>
      <div className="flex justify-between gap-3 border-t-[3px] border-double border-line pt-4 text-xs font-semibold">
        <span className="flex flex-wrap items-center gap-3.5">
          {t.totalLabel}{' '}
          <span className="inline-flex items-center gap-1 text-2xs font-normal text-success-ink">
            <Check className="size-3.5" aria-hidden="true" />{t.checksOutBadge}
          </span>
        </span>
        <strong className="font-bold text-ink tabular-nums break-words">
          {money.format(amount)} <small className="text-2xs font-semibold text-muted">MAD</small>
        </strong>
      </div>
      {!steps && (
        <p className="mt-3 text-xs leading-relaxed text-muted">
          These are the recorded envelope totals. The payment response does not include its individual rule steps.
        </p>
      )}
    </Card>
  )
}
