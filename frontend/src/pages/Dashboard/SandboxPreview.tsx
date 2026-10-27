import { FlaskConical } from 'lucide-react'
import type { PreviewResult } from './dashboardSplit'
import { DashboardSplitRibbon } from './DashboardSplitRibbon'
import { PaymentReceipt } from './PaymentReceipt'
import { money } from '../../utils/format'
import { useTranslation } from '../../i18n'
import { EmptyState } from '../../components/ui/EmptyState'

interface SandboxPreviewProps {
  amount: number
  reference: string
  updating: boolean
  result: PreviewResult
}

/** Result panel for the sandbox: split ribbon + receipt, or an empty prompt. */
export function SandboxPreview({ amount, reference, updating, result }: SandboxPreviewProps) {
  const { t } = useTranslation()
  const valid = Number.isFinite(amount) && amount > 0

  return (
    <section className="mt-9 max-w-[900px]" aria-busy={updating}>
      <header className="mb-5 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold tracking-tight text-ink">
            {valid ? t.whatAmountWouldDo.replace('{amount}', money.format(amount)) : t.yourPaymentPreview}
          </h2>
          <p className="mt-2 text-sm text-muted">{t.usingSavedRulesDesc}</p>
        </div>
        {updating && <span className="text-xs text-muted">Updating…</span>}
      </header>

      {valid ? (
        <>
          <div className="py-5 pb-9">
            <DashboardSplitRibbon amount={amount} allocations={result.allocations} preview previewLabel="Test payment" />
          </div>
          <PaymentReceipt
            amount={amount}
            allocations={result.allocations}
            reference={reference.trim() || 'Test payment'}
            steps={result.steps}
          />
        </>
      ) : (
        <EmptyState
          icon={<FlaskConical />}
          title={t.tryAnAmountHeading}
          description={t.tryAnAmountDescription}
        />
      )}
    </section>
  )
}
