import type { DashboardRule, DashboardTransaction, WalletType } from '../dashboardApi'
import type { EnvelopeHistory } from '../envelopeHistory'
import { envelopeMeta, ruleDescription } from '../envelopeDisplay'
import { money } from '../../../utils/format'
import { paymentDate } from '../paymentUtils'
import type { Translations } from '../../../i18n'

export interface GlanceRow {
  label: string
  value: string
}

export function glanceRows(
  type: WalletType,
  balance: number,
  total: number,
  target: number | null,
  rule: DashboardRule | undefined,
  history: EnvelopeHistory,
  processedPayments: DashboardTransaction[],
  t: Translations,
): GlanceRow[] {
  const share = total > 0 ? `${((balance / total) * 100).toFixed(1)}%` : '0.0%'
  const lastRow = history.rows[0]
  const lastAdded = lastRow
    ? `${lastRow.added >= 0 ? '+' : '−'}${money.format(Math.abs(lastRow.added))} (${lastRow.payment.reference})`
    : history.status === 'unavailable'
      ? 'Unavailable'
      : t.noneYet

  if (type === 'rent' && target !== null) {
    const filledRow = history.rows[history.rows.length - 1]
    const skippedCount = processedPayments.filter((payment) => payment.allocations?.rent === 0).length
    const hasAllocationData = processedPayments.length > 0 &&
      processedPayments.every((payment) => payment.allocations?.rent !== undefined)
    return [
      { label: t.targetLabel, value: `${money.format(target)} MAD` },
      { label: t.statusLabel, value: balance >= target ? t.metForThisCycle : t.madToGo.replace('{amount}', money.format(Math.max(0, target - balance))) },
      { label: t.filledByLabel, value: filledRow ? `${filledRow.payment.reference}${filledRow.payment.created_at ? ` · ${paymentDate(filledRow.payment.created_at)}` : ''}` : lastAdded },
      { label: t.skippedByLabel, value: hasAllocationData ? `${skippedCount} later ${skippedCount === 1 ? 'payment' : 'payments'}` : 'Unavailable' },
    ]
  }

  if (type === 'savings' && target !== null) {
    return [
      { label: t.capLabel, value: `${money.format(target)} MAD` },
      { label: t.progressLabel, value: `${money.format(balance)} of ${money.format(target)} (${Math.min(100, Math.round((balance / target) * 100))}%)` },
      { label: t.remainingLabel, value: t.madToCap.replace('{amount}', money.format(Math.max(0, target - balance))) },
      { label: t.addedLastLabel, value: lastAdded },
    ]
  }

  return [
    { label: t.shareOfTotalLabel, value: share },
    { label: t.addedLastLabel, value: lastAdded },
    { label: t.paymentsCountLabel, value: history.status === 'ready' ? `${history.rows.length} recorded` : `${processedPayments.length} processed` },
    { label: t.capLabel, value: target !== null ? `${money.format(target)} MAD` : rule ? 'None' : t.noActiveRule },
  ]
}

export function insightCopy(type: WalletType, balance: number, target: number | null, rule: DashboardRule | undefined) {
  if (!rule) return `${envelopeMeta[type].name} has no active rule right now.`
  if (type === 'rent' && target !== null && balance >= target) {
    return `Rent is already at its ${money.format(target)} target, so the next payment will skip this rule.`
  }
  if (type === 'savings' && target !== null) {
    return `${money.format(Math.max(0, target - balance))} MAD left until the ${money.format(target)} cap.`
  }
  return `${ruleDescription(rule)}.`
}
