import { ArrowDownLeft, ArrowLeft, ChevronRight, Mail } from 'lucide-react'
import { useState } from 'react'
import type { DashboardTransaction } from './dashboardApi'
import { envelopeMeta, money, walletOrder } from './envelopeDisplay'
import { formatDate } from '../../utils/format'
import { hasCompleteSplit } from './paymentUtils'
import { useTranslation } from '../../i18n'
import { Button } from '../../components/ui/Button'
import { cn } from '../../utils/cn'

interface NotificationsViewProps {
  payments: DashboardTransaction[]
  readIds: string[]
  unread: number
  onRead: (ids: string[]) => void
  onSelect: (payment: DashboardTransaction) => void
  onBack?: () => void
  onSettings?: () => void
  enabled?: boolean
  compact?: boolean
}

export function NotificationsView({
  payments,
  readIds,
  unread,
  onRead,
  onSelect,
  onBack,
  onSettings,
  enabled = true,
  compact = false,
}: NotificationsViewProps) {
  const { t } = useTranslation()
  const [limit, setLimit] = useState(30)
  const visible = compact
    ? payments.filter((payment) => !readIds.includes(payment.id)).slice(0, 5)
    : payments.slice(0, limit)

  return (
    <section
      className={cn('flex flex-col', compact ? 'max-h-[min(600px,65dvh)] w-full' : 'mx-auto w-full max-w-[760px] overflow-hidden rounded-card border border-line bg-surface')}
      aria-label={t.notificationsHeading}
    >
      <header className="flex items-center justify-between gap-3 border-b border-line px-5 py-[18px]">
        <div className="flex min-w-0 items-center gap-3">
          {onBack && !compact && (
            <button type="button" onClick={onBack} aria-label={t.actionBack} className="text-muted hover:text-ink">
              <ArrowLeft className="size-5" aria-hidden="true" />
            </button>
          )}
          <h1 className={cn('font-extrabold text-ink', compact ? 'text-base' : 'text-[21px]')}>{t.notificationsHeading}</h1>
        </div>
        <button
          type="button"
          disabled={!unread}
          onClick={() => onRead(payments.map((payment) => payment.id))}
          className="shrink-0 text-xs font-semibold text-accent hover:underline disabled:cursor-default disabled:text-subtle"
        >
          {t.markAllAsReadBtn}
        </button>
      </header>

      {unread > 0 ? (
        <>
          <div className={cn('px-2 pb-2', compact && 'overflow-y-auto')} aria-label="Payment updates">
            {visible.map((payment) => {
              const isUnread = !readIds.includes(payment.id)
              const split = hasCompleteSplit(payment)
                ? walletOrder.filter((type) => (payment.allocations?.[type] ?? 0) > 0).map((type) => envelopeMeta[type].name)
                : []
              return (
                <button
                  key={payment.id}
                  type="button"
                  className={cn(
                    'flex w-full items-start gap-3 rounded-[10px] px-3 py-3.5 text-start hover:bg-canvas',
                    isUnread && 'bg-layer/70',
                  )}
                  onClick={() => { onRead([payment.id]); onSelect(payment) }}
                >
                  <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-full bg-layer text-muted">
                    <ArrowDownLeft className="size-[18px]" aria-hidden="true" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <strong className="block text-xs font-semibold text-ink break-words">
                      +{money.format(payment.amount)} MAD from {payment.reference}
                    </strong>
                    <span className="mt-1 block text-xs leading-relaxed text-muted">
                      {payment.status === 'failed'
                        ? 'Payment processing failed.'
                        : payment.status === 'pending'
                          ? 'Waiting for the payment to finish processing.'
                          : split.length
                            ? `Split into ${split.join(', ')}.`
                            : 'Payment processed. Open to view its status.'}
                    </span>
                    <small className="mt-1 block text-3xs text-subtle">{formatDate(payment.created_at, true) || 'Time not provided'}</small>
                  </span>
                  {isUnread && <span className="mt-1.5 size-[7px] shrink-0 rounded-full bg-body" aria-label="Unread" />}
                </button>
              )
            })}
          </div>
          {!compact && (
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-5 py-4">
              <p className="text-xs text-muted" role="status">Showing {visible.length} of {payments.length} payment updates</p>
              {visible.length < payments.length && (
                <Button variant="secondary" onClick={() => setLimit((value) => value + 30)}>Load more notifications</Button>
              )}
            </div>
          )}
        </>
      ) : (
        <div className="px-6 py-12 text-center">
          <div className="mb-6 flex justify-center text-[#7f9fba]" aria-hidden="true">
            <Mail className="size-10 fill-[#e3edf5] -rotate-12" />
            <Mail className="size-10 fill-[#e3edf5]" />
            <Mail className="size-10 fill-[#e3edf5] rotate-12" />
          </div>
          <h2 className="text-lg font-bold text-ink">{enabled ? 'You’re all caught up.' : 'Payment alerts are off.'}</h2>
          <p className="mx-auto mt-2.5 max-w-[250px] text-[13px] leading-relaxed text-subtle">
            {enabled ? 'New payment updates show up here.' : 'Turn them on in Notification settings to see payment updates here.'}
          </p>
        </div>
      )}

      {onSettings && (
        <footer className={cn('mt-auto grid gap-2.5 px-[18px] py-3.5 text-3xs text-subtle', !compact && 'border-t border-line')}>
          <button type="button" onClick={onSettings} className="flex w-fit items-center gap-1 text-xs text-accent hover:underline">
            Notification settings <ChevronRight className="size-3.5" aria-hidden="true" />
          </button>
          <span>Payment updates · Read status saved in this browser</span>
          {compact && onBack && (
            <button type="button" onClick={onBack} className="flex w-fit items-center gap-1 text-xs text-accent hover:underline">
              View notifications <ChevronRight className="size-3.5" aria-hidden="true" />
            </button>
          )}
        </footer>
      )}
    </section>
  )
}
