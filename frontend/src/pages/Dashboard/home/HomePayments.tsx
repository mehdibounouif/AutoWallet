import { ChevronRight, Mail } from 'lucide-react'
import type { DashboardTransaction } from '../dashboardApi'
import { money } from '../../../utils/format'
import { Card } from '../../../components/ui/Card'
import { PaymentSplitBar, PaymentStatus } from '../PaymentDisplay'
import { paymentDate } from '../paymentUtils'
import { useTranslation } from '../../../i18n'

/** Recent-payments table (desktop) and month-less list (mobile). */
export function HomePayments({ payments, onSelect, limit }: {
  payments: DashboardTransaction[]
  onSelect: (payment: DashboardTransaction) => void
  limit?: number
}) {
  const { t } = useTranslation()
  const visible = limit === undefined ? payments : payments.slice(0, limit)

  if (payments.length === 0) {
    return (
      <Card className="flex min-h-[240px] flex-col items-center justify-center p-5 text-center">
        <div className="flex items-center text-[#7ea4c1]" aria-hidden="true">
          <span className="me-2 w-10 border-t-2 border-dashed border-[#9fb1c0]" />
          <Mail className="size-8 fill-[#d7e7f3]" />
          <Mail className="-ms-1 size-8 fill-[#d7e7f3]" />
          <Mail className="-ms-1 size-8 fill-[#d7e7f3]" />
        </div>
        <h3 className="mt-5 text-base font-bold text-body">{t.noPaymentsYetHeading}</h3>
        <p className="mt-2 max-w-xs text-sm leading-6 text-muted">{t.noPaymentsYetDescription}</p>
      </Card>
    )
  }

  return (
    <>
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full border-collapse text-xs">
          <thead>
            <tr>
              {[t.thReference, t.thReceived].map((label) => (
                <th key={label} className="border-b border-line px-2 py-3 text-start font-bold whitespace-nowrap text-muted first:ps-0">{label}</th>
              ))}
              <th className="border-b border-line px-2 py-3 text-end font-bold whitespace-nowrap text-muted">{t.thAmountMad}</th>
              <th className="border-b border-line px-2 py-3 text-start font-bold whitespace-nowrap text-muted">{t.thSplit}</th>
              <th className="border-b border-line px-2 py-3 text-start font-bold whitespace-nowrap text-muted">{t.thStatus}</th>
              <th className="border-b border-line px-2 py-3 pe-0">
                <span className="sr-only">{t.thOpenSr}</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {visible.map((payment) => (
              <tr key={payment.id}>
                <td className="border-b border-line px-2 py-3 ps-0 font-mono font-semibold text-body">{payment.reference}</td>
                <td className="border-b border-line px-2 py-3 text-muted">{paymentDate(payment.created_at) || '—'}</td>
                <td className="border-b border-line px-2 py-3 text-end font-semibold tabular-nums text-body">{money.format(payment.amount)}</td>
                <td className="w-[32%] border-b border-line px-2 py-3">
                  <PaymentSplitBar payment={payment} />
                </td>
                <td className="border-b border-line px-2 py-3">
                  <PaymentStatus status={payment.status} />
                </td>
                <td className="border-b border-line px-2 py-3 pe-0">
                  <button
                    type="button"
                    onClick={() => onSelect(payment)}
                    aria-label={`View ${payment.reference}`}
                    className="text-subtle transition-colors hover:text-accent"
                  >
                    <ChevronRight className="size-4" aria-hidden="true" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="divide-y divide-line md:hidden">
        {visible.map((payment) => (
          <button type="button" key={payment.id} onClick={() => onSelect(payment)} className="block w-full py-3.5 text-start">
            <span className="flex items-center justify-between gap-2">
              <span className="truncate font-mono text-xs font-semibold text-body">{payment.reference}</span>
              <strong className="text-sm tabular-nums text-body">{money.format(payment.amount)}</strong>
            </span>
            <span className="mt-2 flex items-center gap-2">
              <span className="shrink-0 text-xs text-subtle">{paymentDate(payment.created_at) || '—'}</span>
              <span className="min-w-0 flex-1"><PaymentSplitBar payment={payment} /></span>
              <PaymentStatus status={payment.status} />
            </span>
          </button>
        ))}
      </div>
    </>
  )
}
