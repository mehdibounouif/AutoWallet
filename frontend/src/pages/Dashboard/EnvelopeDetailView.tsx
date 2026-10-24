import { useState } from 'react'
import { ArrowLeft, ArrowRight, Check, ChevronRight, MinusCircle, Sparkles, X } from 'lucide-react'
import { Dialog } from '../../components/common/Dialog'
import { parseAmount } from '../../utils/format'
import type { DashboardData, DashboardRule, DashboardTransaction, WalletType } from './dashboardApi'
import {
  envelopeDescription,
  envelopeMeta,
  envelopeTarget,
  money,
  ruleDescription,
  walletOrder,
} from './envelopeDisplay'
import { buildEnvelopeHistory } from './envelopeHistory'
import { newestPaymentsFirst, paymentDate } from './paymentUtils'
import { useTranslation } from '../../i18n'
import './envelopeDetail.css'

interface EnvelopeDetailViewProps {
  type: WalletType
  data: DashboardData
  onBack: () => void
  onOpenRules: () => void
  onOpenPayment: (payment: DashboardTransaction) => void
  actionDisabled?: boolean
  onSpendMoney?: (payload: {
    wallet_type: WalletType
    amount: number
    reference?: string
  }) => Promise<void>
  onAskAssistant?: (question: string) => void
}

function glanceRows(
  type: WalletType,
  balance: number,
  total: number,
  target: number | null,
  rule: DashboardRule | undefined,
  history: ReturnType<typeof buildEnvelopeHistory>,
  processedPayments: DashboardTransaction[],
  t: ReturnType<typeof useTranslation>['t'],
): { label: string; value: string }[] {
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

function insightCopy(type: WalletType, balance: number, target: number | null, rule: DashboardRule | undefined) {
  if (!rule) return `${envelopeMeta[type].name} has no active rule right now.`
  if (type === 'rent' && target !== null && balance >= target) {
    return `Rent is already at its ${money.format(target)} target, so the next payment will skip this rule.`
  }
  if (type === 'savings' && target !== null) {
    return `${money.format(Math.max(0, target - balance))} MAD left until the ${money.format(target)} cap.`
  }
  return `${ruleDescription(rule)}.`
}

export function EnvelopeDetailView({
  type,
  data,
  onBack,
  onOpenRules,
  onOpenPayment,
  actionDisabled = false,
  onSpendMoney,
  onAskAssistant,
}: EnvelopeDetailViewProps) {
  const { t, lang } = useTranslation()
  const meta = envelopeMeta[type]
  const Icon = meta.icon
  const balances = new Map<WalletType, number>(data.wallets.map((wallet) => [wallet.wallet_type, wallet.balance]))
  const balance = balances.get(type) ?? 0
  const total = walletOrder.reduce((sum, item) => sum + (balances.get(item) ?? 0), 0)
  const share = total > 0 ? ((balance / total) * 100).toFixed(1) : '0.0'
  const rules = [...data.rules].sort((a, b) => a.priority - b.priority)
  const rule = rules.find((item) => item.target_wallet === type)
  const target = envelopeTarget(type, rules)
  const percent = target ? Math.min(100, Math.round((balance / target) * 100)) : null
  const processedPayments = newestPaymentsFirst(data.transactions.filter((payment) => payment.status === 'processed'))
  const history = buildEnvelopeHistory(type, data.transactions, balance)
  const rows = glanceRows(type, balance, total, target, rule, history, processedPayments, t)

  const [spendOpen, setSpendOpen] = useState(false)
  const [amountInput, setAmountInput] = useState('')
  const [referenceInput, setReferenceInput] = useState('')
  const [modalError, setModalError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const openSpendDialog = () => {
    setAmountInput('')
    setReferenceInput('')
    setModalError(null)
    setSpendOpen(true)
  }

  const handleSpendSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!onSpendMoney) return
    const parsed = parseAmount(amountInput)
    if (!Number.isFinite(parsed) || parsed <= 0) {
      setModalError('Enter an amount above 0.00 MAD.')
      return
    }
    if (parsed > balance + 0.001) {
      setModalError(`Only ${money.format(balance)} MAD is available in ${meta.name}.`)
      return
    }
    setSubmitting(true)
    setModalError(null)
    try {
      await onSpendMoney({
        wallet_type: type,
        amount: parsed,
        reference: referenceInput.trim() || undefined,
      })
      setSpendOpen(false)
    } catch (err) {
      setModalError(err instanceof Error ? err.message : 'Could not record spending.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="envelope-detail" aria-labelledby="envelope-detail-heading">
      <button type="button" onClick={onBack} className="envelope-detail-mobile-back" aria-label={t.backToEnvelopes}>
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        {t.navEnvelopes}
      </button>

      <div className="envelope-detail-hero">
        <div className="envelope-detail-hero-identity">
          <span className="envelope-detail-icon" style={{ backgroundColor: meta.tint, color: meta.color }} aria-hidden="true">
            <Icon className="h-6 w-6" />
          </span>
          <div>
            <h1 id="envelope-detail-heading">{meta.name}</h1>
            <p>{envelopeDescription(type, rules)}</p>
          </div>
        </div>

        <div className="envelope-detail-hero-balance">
          <strong>
            {money.format(balance)} <small>MAD</small>
          </strong>
          {target !== null && percent !== null ? (
            <div className="envelope-detail-target">
              <span
                className="envelope-detail-target-track"
                role="progressbar"
                aria-label={`${meta.name} target progress`}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={percent}
              >
                <span style={{ width: `${percent}%`, backgroundColor: meta.color }} />
              </span>
              <small>
                {percent >= 100 ? (
                  <>
                    <Check className="h-3.5 w-3.5" aria-hidden="true" />
                    Target met · {money.format(target)}
                  </>
                ) : (
                  <>
                    {type === 'savings' ? 'Cap' : 'Target'} {money.format(target)} · {money.format(Math.max(0, target - balance))} to go ({percent}%)
                  </>
                )}
              </small>
            </div>
          ) : (
            <small>{share}% of your total balance</small>
          )}
        </div>
      </div>

      <div className="envelope-detail-actions">
        {onSpendMoney && (
          <button
            type="button"
            className="dashboard-secondary-button envelope-detail-move"
            onClick={openSpendDialog}
            disabled={actionDisabled || balance <= 0}
          >
            <MinusCircle className="h-4 w-4" aria-hidden="true" />
            {t.spendMoneyAction}
          </button>
        )}
      </div>

      <div className="envelope-detail-panels">
        <section className="envelope-detail-panel envelope-detail-rule" aria-labelledby="envelope-rule-heading">
          <h2 id="envelope-rule-heading">
            {lang === 'fr' ? 'La règle qui l’alimente' : lang === 'ar' ? 'القاعدة التي تملؤه' : 'The rule that fills it'}
          </h2>
          {rule ? (
            <>
              <div className="envelope-detail-rule-card">
                <span className="envelope-detail-priority">{rule.priority}</span>
                <span className="envelope-detail-rule-icon" style={{ backgroundColor: meta.tint, color: meta.color }} aria-hidden="true">
                  <Icon className="h-4 w-4" />
                </span>
                <div>
                  <strong>{rule.name}</strong>
                  <p>{ruleDescription(rule)}</p>
                </div>
                <span className={`envelope-detail-rule-status ${rule.is_active ? 'is-active' : ''}`}>
                  <span aria-hidden="true" />
                  {rule.is_active ? t.ruleStatusActive : t.ruleStatusPaused}
                </span>
              </div>
              <button type="button" onClick={onOpenRules} className="envelope-detail-text-link">
                {t.viewRulesAction}
                <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            </>
          ) : (
            <p className="envelope-detail-muted">
              {lang === 'fr' ? 'Aucune règle définie pour cette enveloppe pour le moment.' : lang === 'ar' ? 'لم يتم تعيين أي قاعدة لهذا الظرف بعد.' : 'No rule is set for this envelope yet.'}
            </p>
          )}
        </section>

        <section className="envelope-detail-panel envelope-detail-glance" aria-labelledby="envelope-glance-heading">
          <h2 id="envelope-glance-heading">{t.atAGlance}</h2>
          <dl>
            {rows.map((row) => (
              <div key={row.label} className="envelope-detail-glance-row">
                <dt>{row.label}</dt>
                <dd>{row.value}</dd>
              </div>
            ))}
          </dl>
        </section>
      </div>

      <aside className="envelope-detail-insight" aria-label="Envelope note">
        <Sparkles className="h-4 w-4" aria-hidden="true" />
        <div>
          <p>{insightCopy(type, balance, target, rule)}</p>
          <button
            type="button"
            disabled={!onAskAssistant}
            onClick={() => onAskAssistant?.(`Explain my ${meta.name} envelope balance (${money.format(balance)} MAD) and how its rule works.`)}
          >
            Ask Assistant
            <ArrowRight className="h-3 w-3" aria-hidden="true" />
          </button>
        </div>
      </aside>

      <section className="envelope-detail-panel envelope-detail-history" aria-labelledby="envelope-history-heading">
        <h2 id="envelope-history-heading">{t.envelopeHistoryHeading}</h2>
        <p>Payments that added to this envelope.</p>
        {history.status === 'ready' && history.rows.length > 0 ? (
          <>
            <div className="envelope-detail-history-desktop">
              <table aria-label={`Payments that changed the ${meta.name} envelope`}>
                <thead>
                  <tr>
                    <th scope="col">Reference</th>
                    <th scope="col">Date</th>
                    <th scope="col">Added (MAD)</th>
                    <th scope="col">Balance after</th>
                    <th scope="col"><span className="sr-only">Open payment</span></th>
                  </tr>
                </thead>
                <tbody>
                  {history.rows.map((row) => (
                    <tr key={row.payment.id}>
                      <td>
                        <button
                          type="button"
                          onClick={() => onOpenPayment(row.payment)}
                          aria-label={`View payment ${row.payment.reference}`}
                        >
                          {row.payment.reference}
                        </button>
                      </td>
                      <td>{paymentDate(row.payment.created_at) || '—'}</td>
                      <td>{row.added >= 0 ? `+${money.format(row.added)}` : `−${money.format(Math.abs(row.added))}`}</td>
                      <td>{money.format(row.balanceAfter)}</td>
                      <td>
                        <ChevronRight className="h-4 w-4" aria-hidden="true" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="envelope-detail-history-mobile">
              {history.rows.map((row) => (
                <button
                  type="button"
                  key={row.payment.id}
                  onClick={() => onOpenPayment(row.payment)}
                  aria-label={`View payment ${row.payment.reference}`}
                >
                  <span>
                    <strong>{row.payment.reference}</strong>
                    <b>{row.added >= 0 ? `+${money.format(row.added)}` : `−${money.format(Math.abs(row.added))}`}</b>
                  </span>
                  <span>
                    <small>{paymentDate(row.payment.created_at) || 'Date unavailable'}</small>
                    <small>Balance after {money.format(row.balanceAfter)}</small>
                  </span>
                  <ChevronRight className="h-4 w-4" aria-hidden="true" />
                </button>
              ))}
            </div>
            <p className="envelope-detail-history-note">
              Payments that skipped this envelope (for example, once a target was already met) aren&apos;t listed here.
            </p>
          </>
        ) : (
          <p className="envelope-detail-history-empty">
            {history.status === 'unavailable'
              ? `We can't show a payment-by-payment history yet because the backend does not yet provide the per-payment allocations that produced this ${money.format(balance)} MAD balance.`
              : `No payments have added to ${meta.name} yet.`}
          </p>
        )}
      </section>

      {spendOpen && (
        <Dialog
          onClose={() => {
            if (!submitting) setSpendOpen(false)
          }}
          dismissible={!submitting}
          labelledBy="detail-spend-title"
          panelClassName="dashboard-modal record-payment-dialog"
        >
          <button
            type="button"
            className="dashboard-modal-close"
            onClick={() => setSpendOpen(false)}
            disabled={submitting}
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
          <h2 id="detail-spend-title">Record spending from {meta.name}</h2>
          <p>Deduct an outgoing payment or bill directly from your {meta.name} envelope ({money.format(balance)} MAD available).</p>
          <form onSubmit={(event) => void handleSpendSubmit(event)} noValidate>
            <label htmlFor="detail-spend-amount">
              Amount (MAD)
              <span className="workspace-amount-input">
                <input
                  id="detail-spend-amount"
                  type="text"
                  inputMode="decimal"
                  className="dashboard-input"
                  value={amountInput}
                  onChange={(event) => {
                    setAmountInput(event.target.value)
                    setModalError(null)
                  }}
                  placeholder="350.00"
                  disabled={submitting}
                />
                <span>MAD</span>
              </span>
            </label>

            <label htmlFor="detail-spend-ref">
              Description / Reference
              <input
                id="detail-spend-ref"
                type="text"
                className="dashboard-input"
                value={referenceInput}
                onChange={(event) => setReferenceInput(event.target.value)}
                placeholder={`Paid from ${meta.name}`}
                maxLength={100}
                disabled={submitting}
              />
            </label>

            {modalError && (
              <p className="workspace-field-error" role="alert">
                {modalError}
              </p>
            )}

            <footer>
              <button
                type="button"
                className="dashboard-secondary-button"
                onClick={() => setSpendOpen(false)}
                disabled={submitting}
              >
                Cancel
              </button>
              <button type="submit" className="dashboard-primary-button" disabled={submitting}>
                {submitting ? 'Recording…' : 'Record spending'}
              </button>
            </footer>
          </form>
        </Dialog>
      )}
    </section>
  )
}
