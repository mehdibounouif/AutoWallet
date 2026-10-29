import { useState } from 'react'
import { ArrowLeft, ArrowRight, Check, MinusCircle, Sparkles } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { Page } from '../../components/ui/Page'
import { cn } from '../../utils/cn'
import type { DashboardData, DashboardTransaction, WalletType } from './dashboardApi'
import {
  envelopeDescription,
  envelopeMeta,
  envelopeTarget,
  money,
  walletOrder,
} from './envelopeDisplay'
import { buildEnvelopeHistory } from './envelopeHistory'
import { newestPaymentsFirst } from './paymentUtils'
import { useTranslation } from '../../i18n'
import { EnvelopeRuleCard } from './envelope/EnvelopeRuleCard'
import { EnvelopeGlanceCard } from './envelope/EnvelopeGlanceCard'
import { EnvelopeHistory } from './envelope/EnvelopeHistory'
import { SpendEnvelopeDialog } from './envelope/SpendEnvelopeDialog'
import { glanceRows, insightCopy } from './envelope/envelopeDetailData'

interface EnvelopeDetailViewProps {
  type: WalletType
  data: DashboardData
  onBack: () => void
  onOpenRules: () => void
  onOpenPayment: (payment: DashboardTransaction) => void
  actionDisabled?: boolean
  onSpendMoney?: (payload: { wallet_type: WalletType; amount: number; reference?: string }) => Promise<void>
  onAskAssistant?: (question: string) => void
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
  const { t } = useTranslation()
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

  return (
    <Page as="section" className="text-body" aria-labelledby="envelope-detail-heading">
      <button
        type="button"
        onClick={onBack}
        className="mb-4 inline-flex items-center gap-1.5 text-[13px] font-semibold text-body md:hidden"
        aria-label={t.backToEnvelopes}
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        {t.navEnvelopes}
      </button>

      <div className="flex min-h-[146px] items-center justify-between gap-8 rounded-[15px] border border-line bg-surface px-8 py-7.5 max-md:block max-md:min-h-0 max-md:px-[18px] max-md:py-[19px]">
        <div className="flex min-w-0 items-center gap-3.5 max-md:gap-[11px]">
          <span
            className="grid size-12 shrink-0 place-items-center rounded-[10px] max-md:size-[38px]"
            style={{ backgroundColor: meta.tint, color: meta.color }}
            aria-hidden="true"
          >
            <Icon className="size-6 max-md:size-5" />
          </span>
          <div className="min-w-0">
            <h1 id="envelope-detail-heading" className="text-[23px] font-extrabold tracking-[-0.025em] text-ink max-md:text-lg">
              {meta.name}
            </h1>
            <p className="mt-1.5 text-xs leading-snug text-muted max-md:text-2xs">{envelopeDescription(type, rules)}</p>
          </div>
        </div>

        <div className="min-w-[260px] text-end max-md:mt-[18px] max-md:min-w-0 max-md:text-start">
          <strong className="block text-[clamp(32px,3.4vw,45px)] leading-none font-extrabold tracking-[-0.045em] whitespace-nowrap text-ink tabular-nums max-md:text-[29px]">
            {money.format(balance)} <small className="text-xs font-bold tracking-normal text-muted">MAD</small>
          </strong>
          {target !== null && percent !== null ? (
            <div className="mt-3.5">
              <div
                className="block h-1 w-full overflow-hidden rounded-full bg-layer-strong"
                role="progressbar"
                aria-label={`${meta.name} target progress`}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={percent}
              >
                <span className="block h-full rounded-full" style={{ width: `${percent}%`, backgroundColor: meta.color }} />
              </div>
              <small className={cn('mt-2 flex items-center justify-end gap-1 text-2xs text-muted max-md:justify-start', percent >= 100 && 'text-success-ink')}>
                {percent >= 100 ? (
                  <>
                    <Check className="size-3.5" aria-hidden="true" />
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
            <small className="mt-3 block text-2xs text-muted">{share}% of your total balance</small>
          )}
        </div>
      </div>

      <div className="my-6 flex flex-wrap gap-3 max-md:my-4 max-md:grid max-md:grid-cols-2">
        {onSpendMoney && (
          <Button
            variant="outline"
            size="lg"
            className="border-line-strong"
            onClick={() => setSpendOpen(true)}
            disabled={actionDisabled || balance <= 0}
          >
            <MinusCircle className="size-4" aria-hidden="true" />
            {t.spendMoneyAction}
          </Button>
        )}
      </div>

      <div className="grid grid-cols-[minmax(0,1.65fr)_minmax(280px,0.95fr)] gap-6 max-[960px]:grid-cols-[minmax(0,1.3fr)_minmax(250px,1fr)] max-[960px]:gap-3.5 max-md:grid-cols-1 max-md:gap-[18px]">
        <EnvelopeRuleCard type={type} rule={rule} onOpenRules={onOpenRules} />
        <EnvelopeGlanceCard rows={rows} />
      </div>

      <aside className="my-6 flex items-start gap-2.5 text-xs leading-relaxed text-muted max-md:my-[18px]" aria-label="Envelope note">
        <Sparkles className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
        <div>
          <p>{insightCopy(type, balance, target, rule)}</p>
          <button
            type="button"
            disabled={!onAskAssistant}
            onClick={() => onAskAssistant?.(`Explain my ${meta.name} envelope balance (${money.format(balance)} MAD) and how its rule works.`)}
            className="mt-1.5 inline-flex items-center gap-1 font-bold text-accent hover:underline disabled:cursor-not-allowed disabled:text-subtle"
          >
            Ask Assistant
            <ArrowRight className="size-3" aria-hidden="true" />
          </button>
        </div>
      </aside>

      <EnvelopeHistory type={type} history={history} balance={balance} onOpenPayment={onOpenPayment} />

      {spendOpen && onSpendMoney && (
        <SpendEnvelopeDialog
          type={type}
          balance={balance}
          onClose={() => setSpendOpen(false)}
          onSubmit={onSpendMoney}
        />
      )}
    </Page>
  )
}
