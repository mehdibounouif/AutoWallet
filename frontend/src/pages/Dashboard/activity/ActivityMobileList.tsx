import type { DashboardTransaction } from '../dashboardApi'
import { money } from '../../../utils/format'
import { PaymentSplitBar, PaymentStatus } from '../PaymentDisplay'
import { paymentDate } from '../paymentUtils'
import type { ActivityGroup } from './activityUtils'
import { accessiblePaymentLabel, monthTitle } from './activityUtils'

/** Phone activity list grouped by month. */
export function ActivityMobileList({ groups, onSelect }: {
  groups: ActivityGroup[]
  onSelect: (payment: DashboardTransaction) => void
}) {
  return (
    <div className="px-4 md:hidden">
      {groups.map(([key, items]) => (
        <section key={key} className="mb-[22px]" aria-label={monthTitle(key)}>
          <div className="mb-2 flex items-baseline justify-between gap-2 text-xs text-body">
            <strong className="font-extrabold whitespace-nowrap">{monthTitle(key)}</strong>
            <span className="text-3xs whitespace-nowrap text-muted">
              {items.length} {items.length === 1 ? 'payment' : 'payments'} · {money.format(items.reduce((sum, payment) => sum + payment.amount, 0))}
            </span>
          </div>
          {items.map((payment) => (
            <button
              type="button"
              key={payment.id}
              className="block min-h-[78px] w-full border-b border-line py-3 text-start hover:bg-layer"
              onClick={() => onSelect(payment)}
              aria-label={accessiblePaymentLabel(payment)}
            >
              <span className="flex items-center justify-between gap-2 text-xs text-body">
                <strong className="min-w-0 truncate font-mono text-2xs font-bold">{payment.reference}</strong>
                <b className="text-xs tabular-nums">{money.format(payment.amount)}</b>
              </span>
              <span className="mt-2 flex items-center gap-2 text-2xs text-muted">
                <span className="shrink-0">{paymentDate(payment.created_at) || 'Date unavailable'}</span>
                <span className="min-w-0 flex-1"><PaymentSplitBar payment={payment} /></span>
                <PaymentStatus status={payment.status} />
              </span>
            </button>
          ))}
        </section>
      ))}
    </div>
  )
}
