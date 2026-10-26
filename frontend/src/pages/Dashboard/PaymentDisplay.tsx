import { AlertCircle, Check, Clock3 } from 'lucide-react'
import type { DashboardTransaction, WalletType } from './dashboardApi'
import { envelopeMeta, money } from './envelopeDisplay'
import { hasCompleteSplit } from './paymentUtils'
import { Badge } from '../../components/ui/Badge'

const statusMeta = {
  processed: { label: 'Processed', tone: 'success' as const, icon: Check },
  pending: { label: 'Pending', tone: 'warning' as const, icon: Clock3 },
  failed: { label: 'Failed', tone: 'danger' as const, icon: AlertCircle },
}

export function PaymentStatus({ status }: { status: DashboardTransaction['status'] }) {
  const { label, tone, icon: Icon } = statusMeta[status]
  return (
    <Badge tone={tone} icon={<Icon className="size-3.5" aria-hidden="true" />}>
      {label}
    </Badge>
  )
}

export function PaymentSplitBar({ payment }: { payment: DashboardTransaction }) {
  if (payment.status === 'pending') return <span className="text-xs text-muted">Splitting…</span>
  if (!hasCompleteSplit(payment)) return <span className="text-xs text-subtle">Breakdown unavailable</span>

  const types: WalletType[] = ['rent', 'tax', 'savings', 'free', 'main']
  const label = types
    .filter((type) => (payment.allocations?.[type] ?? 0) > 0)
    .map((type) => `${envelopeMeta[type].name} ${money.format(payment.allocations?.[type] ?? 0)} MAD`)
    .join(', ')

  return (
    <span
      className="inline-flex h-[7px] w-full max-w-[172px] overflow-hidden rounded-full bg-layer-strong align-middle"
      role="img"
      aria-label="Payment split by envelope"
      aria-description={label}
    >
      {types.map((type) => {
        const amount = payment.allocations?.[type] ?? 0
        if (amount <= 0) return null
        return (
          <span
            key={type}
            style={{ width: `${(amount / payment.amount) * 100}%`, backgroundColor: envelopeMeta[type].color }}
          />
        )
      })}
    </span>
  )
}
