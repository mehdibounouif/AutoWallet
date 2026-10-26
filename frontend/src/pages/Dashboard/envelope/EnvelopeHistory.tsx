import { ChevronRight } from 'lucide-react'
import type { DashboardTransaction, WalletType } from '../dashboardApi'
import type { EnvelopeHistory as EnvelopeHistoryData } from '../envelopeHistory'
import { envelopeMeta } from '../envelopeDisplay'
import { money } from '../../../utils/format'
import { paymentDate } from '../paymentUtils'
import { useTranslation } from '../../../i18n'
import { Card } from '../../../components/ui/Card'
import { cn } from '../../../utils/cn'

/** Reconciled envelope ledger, or an explicit explanation when the API lacks data. */
export function EnvelopeHistory({ type, history, balance, onOpenPayment }: {
  type: WalletType
  history: EnvelopeHistoryData
  balance: number
  onOpenPayment: (payment: DashboardTransaction) => void
}) {
  const { t } = useTranslation()
  const meta = envelopeMeta[type]

  return (
    <Card as="section" className="mt-6 p-6 max-md:mt-[18px] max-md:p-4" aria-labelledby="envelope-history-heading">
      <h2 id="envelope-history-heading" className="text-base font-extrabold text-ink max-md:text-[15px]">{t.envelopeHistoryHeading}</h2>
      <p className="mt-1.5 text-xs leading-snug text-muted">Payments that added to this envelope.</p>

      {history.status === 'ready' && history.rows.length > 0 ? (
        <>
          <div className="mt-6 hidden overflow-x-auto md:block">
            <table className="w-full border-collapse text-xs" aria-label={`Payments that changed the ${meta.name} envelope`}>
              <thead>
                <tr>
                  {['Reference', 'Date', 'Added (MAD)', 'Balance after'].map((label, index) => (
                    <th
                      key={label}
                      scope="col"
                      className={cn('border-b border-line px-2 pb-3 text-start font-semibold whitespace-nowrap text-muted first:ps-0', index >= 2 && 'text-end')}
                    >
                      {label}
                    </th>
                  ))}
                  <th scope="col" className="border-b border-line px-2 pb-3 pe-0">
                    <span className="sr-only">Open payment</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {history.rows.map((row) => (
                  <tr key={row.payment.id}>
                    <td className="border-b border-line px-2 py-4 ps-0 whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => onOpenPayment(row.payment)}
                        aria-label={`View payment ${row.payment.reference}`}
                        className="font-mono font-bold text-body hover:text-accent hover:underline"
                      >
                        {row.payment.reference}
                      </button>
                    </td>
                    <td className="border-b border-line px-2 py-4 whitespace-nowrap text-muted">{paymentDate(row.payment.created_at) || '—'}</td>
                    <td className="border-b border-line px-2 py-4 text-end font-bold whitespace-nowrap text-body tabular-nums">
                      {row.added >= 0 ? `+${money.format(row.added)}` : `−${money.format(Math.abs(row.added))}`}
                    </td>
                    <td className="border-b border-line px-2 py-4 text-end whitespace-nowrap text-muted tabular-nums">{money.format(row.balanceAfter)}</td>
                    <td className="w-5 border-b border-line py-4 pe-0 text-end text-muted">
                      <ChevronRight className="size-4" aria-hidden="true" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-2 md:hidden">
            {history.rows.map((row) => (
              <button
                type="button"
                key={row.payment.id}
                onClick={() => onOpenPayment(row.payment)}
                aria-label={`View payment ${row.payment.reference}`}
                className="relative block w-full border-b border-line py-3.5 pe-5 text-start"
              >
                <span className="flex justify-between gap-2">
                  <strong className="font-mono text-2xs font-bold text-body">{row.payment.reference}</strong>
                  <b className="text-xs text-body">{row.added >= 0 ? `+${money.format(row.added)}` : `−${money.format(Math.abs(row.added))}`}</b>
                </span>
                <span className="mt-1 flex justify-between gap-2">
                  <small className="text-3xs text-muted">{paymentDate(row.payment.created_at) || 'Date unavailable'}</small>
                  <small className="text-3xs text-muted">Balance after {money.format(row.balanceAfter)}</small>
                </span>
                <ChevronRight className="absolute end-0 top-6 size-4 text-muted" aria-hidden="true" />
              </button>
            ))}
          </div>
          <p className="mt-4 text-2xs text-subtle">
            Payments that skipped this envelope (for example, once a target was already met) aren&apos;t listed here.
          </p>
        </>
      ) : (
        <p className="mt-6 rounded-lg border border-dashed border-line-strong p-5 text-[13px] text-muted">
          {history.status === 'unavailable'
            ? `We can't show a payment-by-payment history yet because the backend does not yet provide the per-payment allocations that produced this ${money.format(balance)} MAD balance.`
            : `No payments have added to ${meta.name} yet.`}
        </p>
      )}
    </Card>
  )
}
