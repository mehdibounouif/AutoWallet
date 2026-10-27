import { AlertCircle, ArrowLeft, Check, Clock3, Info } from 'lucide-react'
import type { DashboardData } from './dashboardApi'
import { PaymentStatus } from './PaymentDisplay'
import { DashboardSplitRibbon } from './DashboardSplitRibbon'
import { PaymentReceipt } from './PaymentReceipt'
import { hasCompleteSplit } from './paymentUtils'
import { formatDate, money } from '../../utils/format'
import type { SplitAmounts } from './dashboardSplit'
import { useTranslation } from '../../i18n'
import { Alert } from '../../components/ui/Alert'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { EmptyState } from '../../components/ui/EmptyState'
import { Page } from '../../components/ui/Page'
import { cn } from '../../utils/cn'

export function PaymentDetailView({ paymentId, data, onBack, onRefresh }: {
  paymentId: string
  data: DashboardData
  onBack: () => void
  onRefresh: () => void
}) {
  const { t } = useTranslation()
  const payment = data.transactions.find((item) => item.id === paymentId)

  if (!payment) {
    return (
      <EmptyState
        icon={<AlertCircle />}
        title="Payment not found"
        description="This payment is not in your account’s payment list."
        action={<Button onClick={onBack}>Back to Activity</Button>}
      />
    )
  }

  const complete = payment.status === 'processed' && hasCompleteSplit(payment)
  const allocations: SplitAmounts = { main: 0, rent: 0, tax: 0, savings: 0, free: 0, ...payment.allocations }
  const received = formatDate(payment.created_at, true)
  const time = payment.created_at
    ? new Intl.DateTimeFormat('en-US', { hour: '2-digit', minute: '2-digit' }).format(new Date(payment.created_at))
    : ''

  return (
    <Page>
      <button type="button" onClick={onBack} className="mb-4 inline-flex items-center gap-1.5 text-xs font-semibold text-accent hover:underline">
        <ArrowLeft className="size-4" aria-hidden="true" />
        {t.navActivity}
      </button>

      <header className="mb-6">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-[28px] font-extrabold tracking-[-0.035em] text-ink">{payment.reference}</h1>
          <PaymentStatus status={payment.status} />
        </div>
        <p className="mt-2 text-[13px] leading-relaxed text-muted">
          {money.format(payment.amount)} MAD
          {received ? ` · Received ${received}, ${time}` : ''}
          {data.user.bank_account_id ? ` · into ••••${data.user.bank_account_id.slice(-4)}` : ''}
        </p>
      </header>

      {complete && (
        <>
          <Alert tone="info" icon={<Info className="size-[17px]" />}>This is the recorded split for this payment.</Alert>
          <div className="py-5 pb-9">
            <DashboardSplitRibbon amount={payment.amount} allocations={allocations} reference={payment.reference} />
          </div>
        </>
      )}

      {payment.status === 'failed' && (
        <Alert tone="danger" icon={<AlertCircle className="size-[18px]" />} className="mb-5">
          This payment failed. No successful split is available.
        </Alert>
      )}
      {payment.status === 'pending' && (
        <Alert
          tone="info"
          icon={<Clock3 className="size-[18px]" />}
          className="mb-5"
          action={<button type="button" onClick={onRefresh} className="font-semibold underline">Refresh status</button>}
        >
          This payment is waiting to finish processing.
        </Alert>
      )}

      <div className="grid grid-cols-[minmax(0,2.2fr)_minmax(260px,0.95fr)] items-start gap-6 max-[1100px]:grid-cols-1">
        {complete ? (
          <PaymentReceipt amount={payment.amount} allocations={allocations} reference={payment.reference} />
        ) : (
          <Card as="section" className="p-6 max-md:p-4">
            <AlertCircle className="mb-4 size-6 text-subtle" aria-hidden="true" />
            <h2 className="text-base font-extrabold text-ink">
              {payment.status === 'failed' ? 'What happens now' : payment.status === 'pending' ? 'Waiting for your split' : 'Split details unavailable'}
            </h2>
            <p className="mt-3.5 mb-6 text-[13px] leading-relaxed text-muted">
              {payment.status === 'failed'
                ? 'Check the payment status before recording it again. This service does not currently support retrying a failed payment.'
                : payment.status === 'pending'
                  ? 'Refresh to check whether processing has finished.'
                  : 'The payment service has not returned its saved allocations. Your current rules cannot tell us how an earlier payment was split.'}
            </p>
            <Button variant="secondary" onClick={onRefresh}>Refresh payment</Button>
          </Card>
        )}

        <div className="grid gap-6 max-[1100px]:grid-cols-2 max-md:grid-cols-1 max-md:gap-[18px]">
          <Card as="section" className="p-6 max-md:p-4">
            <h2 className="text-base font-extrabold text-ink">Summary</h2>
            <dl className="mt-3.5 text-xs">
              {[
                ['Reference', payment.reference],
                ['Received', received ? `${received}, ${time}` : 'Not provided'],
                ['Amount', `${money.format(payment.amount)} MAD`],
                ['Into', data.user.bank_account_id ? `••••${data.user.bank_account_id.slice(-4)}` : 'Not linked'],
              ].map(([label, value]) => (
                <div key={label} className="flex items-center justify-between gap-3 border-b border-line py-3">
                  <dt className="text-muted">{label}</dt>
                  <dd className="min-w-0 text-end font-semibold break-words text-body">{value}</dd>
                </div>
              ))}
              <div className="flex items-center justify-between gap-3 py-3">
                <dt className="text-muted">Status</dt>
                <dd><PaymentStatus status={payment.status} /></dd>
              </div>
            </dl>
          </Card>

          <Card as="section" className="p-6 max-md:p-4">
            <h2 className="text-base font-extrabold text-ink">What happened</h2>
            <ol className="mt-6 grid gap-6">
              <li className="flex gap-2.5 text-xs">
                <span className="grid size-[18px] shrink-0 place-items-center rounded-full bg-layer text-muted">
                  <Check className="size-3" aria-hidden="true" />
                </span>
                <div className="flex-1 border-b border-line pb-5">
                  <strong className="font-semibold text-body">Payment received</strong>
                  <p className="mt-1 text-2xs leading-relaxed text-muted">{received || 'Timestamp not provided'}</p>
                </div>
              </li>
              <li className="flex gap-2.5 text-xs">
                <span className={cn('grid size-[18px] shrink-0 place-items-center rounded-full bg-layer text-muted', payment.status === 'failed' && 'bg-action-danger-subtle text-action-danger')}>
                  {payment.status === 'processed'
                    ? <Check className="size-3" aria-hidden="true" />
                    : payment.status === 'failed'
                      ? <AlertCircle className="size-3" aria-hidden="true" />
                      : <Clock3 className="size-3" aria-hidden="true" />}
                </span>
                <div className="flex-1">
                  <strong className="font-semibold text-body">
                    {payment.status === 'processed' ? 'Payment processed' : payment.status === 'failed' ? 'Processing failed' : 'Processing pending'}
                  </strong>
                  <p className="mt-1 text-2xs leading-relaxed text-muted">
                    {complete ? 'Envelope allocations recorded' : 'As reported by the payment service'}
                  </p>
                </div>
              </li>
            </ol>
          </Card>
        </div>
      </div>
    </Page>
  )
}
