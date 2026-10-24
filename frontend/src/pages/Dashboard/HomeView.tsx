import { ArrowRight, Check, ChevronRight, Mail, ShieldCheck, ShoppingBag } from 'lucide-react'
import type { DashboardData, DashboardTransaction, WalletType } from './dashboardApi'
import { previewSplit } from './dashboardSplit'
import type { SplitAmounts } from './dashboardSplit'
import { DashboardSplitRibbon } from './DashboardSplitRibbon'
import { PaymentSplitBar as SplitBar, PaymentStatus as Status } from './PaymentDisplay'
import { hasCompleteSplit, paymentDate as date } from './paymentUtils'
import { envelopeDescription, envelopeMeta, envelopeOrder, envelopeTarget, money } from './envelopeDisplay'
import { useTranslation } from '../../i18n'

const previewAmount = 8500

function EnvelopeRow({ type, data }: { type: WalletType; data: DashboardData }) {
  const { t } = useTranslation()
  const item = envelopeMeta[type]
  const Icon = item.icon
  const balance = data.wallets.find((wallet) => wallet.wallet_type === type)?.balance
  const target = envelopeTarget(type, data.rules)
  const progress = target && balance !== undefined ? Math.max(0, Math.min(100, (balance / target) * 100)) : 0

  return (
    <article className="dashboard-envelope-row">
      <span className="dashboard-envelope-icon" style={{ backgroundColor: item.tint, color: item.color }}>
        <Icon className="h-5 w-5" aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <h3 className="text-sm font-bold text-[#243044]">{item.name}</h3>
          <strong className={`shrink-0 text-sm tabular-nums ${type === 'main' ? 'text-[#65748C]' : 'text-[#243044]'}`}>
            {balance === undefined ? '—' : money.format(balance)}
          </strong>
        </div>
        <p className="mt-1 text-xs leading-5 text-[#66758D]">{envelopeDescription(type, data.rules)}</p>
        {target !== null && balance !== undefined && (
          <div className="mt-3 max-w-[320px]">
            <div
              className="h-1 overflow-hidden rounded-full bg-[#E5EAF0]"
              role="progressbar"
              aria-label={`${item.name} target progress`}
              aria-valuenow={Math.round(progress)}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <span className="block h-full rounded-full" style={{ width: `${progress}%`, backgroundColor: item.color }} />
            </div>
            <p className="mt-2 text-[11px] text-[#66758D]">
              {type === 'rent' && progress >= 100 ? (
                <span className="inline-flex items-center gap-1">
                  <Check className="h-3.5 w-3.5 text-[#188442]" aria-hidden="true" />
                  {t.targetMetBadge}
                </span>
              ) : (
                t.targetProgressFormat
                  .replace('{percent}', String(Math.round(progress)))
                  .replace('{target}', money.format(target))
                  .replace('{kind}', type === 'savings' ? t.capWord : t.targetWord)
              )}
            </p>
          </div>
        )}
      </div>
    </article>
  )
}

function Payments({
  payments,
  onSelect,
  limit,
}: {
  payments: DashboardTransaction[]
  onSelect: (payment: DashboardTransaction) => void
  limit?: number
}) {
  const { t } = useTranslation()
  const visiblePayments = limit === undefined ? payments : payments.slice(0, limit)
  if (payments.length === 0) {
    return (
      <div className="dashboard-empty-payments">
        <div className="flex items-center text-[#7EA4C1]" aria-hidden="true">
          <span className="mr-2 w-10 border-t-2 border-dashed border-[#9FB1C0]" />
          <Mail className="h-8 w-8 fill-[#D7E7F3]" />
          <Mail className="-ml-1 h-8 w-8 fill-[#D7E7F3]" />
          <Mail className="-ml-1 h-8 w-8 fill-[#D7E7F3]" />
        </div>
        <h3 className="mt-5 text-base font-bold text-[#273247]">{t.noPaymentsYetHeading}</h3>
        <p className="mt-2 max-w-xs text-sm leading-6 text-[#728198]">{t.noPaymentsYetDescription}</p>
      </div>
    )
  }

  return (
    <>
      <div className="hidden overflow-x-auto md:block">
        <table className="dashboard-payments-table">
          <thead>
            <tr>
              <th>{t.thReference}</th>
              <th>{t.thReceived}</th>
              <th className="text-right">{t.thAmountMad}</th>
              <th>{t.thSplit}</th>
              <th>{t.thStatus}</th>
              <th>
                <span className="sr-only">{t.thOpenSr}</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {visiblePayments.map((payment) => (
              <tr key={payment.id}>
                <td className="font-mono font-semibold text-[#263246]">{payment.reference}</td>
                <td className="text-[#708099]">{date(payment.created_at) || '—'}</td>
                <td className="text-right font-semibold tabular-nums text-[#263246]">{money.format(payment.amount)}</td>
                <td className="w-[32%]">
                  <SplitBar payment={payment} />
                </td>
                <td>
                  <Status status={payment.status} />
                </td>
                <td>
                  <button
                    type="button"
                    onClick={() => onSelect(payment)}
                    aria-label={`View ${payment.reference}`}
                    className="text-[#8090A7] hover:text-[#5963B6]"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="divide-y divide-[#DCE3EB] md:hidden">
        {visiblePayments.map((payment) => (
          <button type="button" key={payment.id} onClick={() => onSelect(payment)} className="block w-full py-3.5 text-left">
            <span className="flex items-center justify-between gap-2">
              <span className="truncate font-mono text-xs font-semibold text-[#263246]">{payment.reference}</span>
              <strong className="text-sm tabular-nums text-[#263246]">{money.format(payment.amount)}</strong>
            </span>
            <span className="mt-2 flex items-center gap-2">
              <span className="shrink-0 text-xs text-[#7A879B]">{date(payment.created_at) || '—'}</span>
              <span className="min-w-0 flex-1">
                <SplitBar payment={payment} />
              </span>
              <Status status={payment.status} />
            </span>
          </button>
        ))}
      </div>
    </>
  )
}

export function LoadingHome() {
  return (
    <div className="animate-pulse space-y-8" role="status" aria-label="Loading dashboard">
      <div className="h-8 w-60 rounded-lg bg-[#E6EBF1]" />
      <div className="grid gap-8 md:grid-cols-2">
        <div className="space-y-4">
          <div className="h-5 w-32 rounded bg-[#E6EBF1]" />
          <div className="h-14 w-56 rounded bg-[#E6EBF1]" />
          <div className="h-4 w-72 rounded bg-[#E6EBF1]" />
        </div>
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-16 rounded bg-[#E6EBF1]" />
          ))}
        </div>
      </div>
      <div className="h-64 rounded bg-[#E6EBF1]" />
      <div className="h-56 rounded-xl bg-white" />
      <span className="sr-only">Loading dashboard data</span>
    </div>
  )
}

interface HomeViewProps {
  data: DashboardData
  onNavigate: (view: 'sandbox' | 'rules' | 'activity') => void
  onSelectPayment: (payment: DashboardTransaction) => void
}

export function HomeView({ data, onNavigate, onSelectPayment }: HomeViewProps) {
  const { t, lang } = useTranslation()
  const payments = data.transactions
  const firstName = data.user.full_name.trim().split(/\s+/)[0] || 'there'
  const latest = data.transactions.find((payment) => payment.status === 'processed')
  const wallets = data.wallets
  const freeBalance = wallets.find((item) => item.wallet_type === 'free')?.balance ?? 0
  const setAside = wallets
    .filter((item) => item.wallet_type === 'rent' || item.wallet_type === 'tax' || item.wallet_type === 'savings')
    .reduce((sum, item) => sum + item.balance, 0)
  const totalBalance = wallets.reduce((sum, item) => sum + item.balance, 0)
  const historical = data.transactions.find((item) => item.status === 'processed' && hasCompleteSplit(item))
  const ribbonAllocations: SplitAmounts = historical
    ? { main: 0, rent: 0, tax: 0, savings: 0, free: 0, ...historical.allocations }
    : previewSplit(previewAmount, data.rules, wallets)
  const activeRules = data.rules.filter((item) => item.is_active).length
  const hour = new Date().getHours()
  const greeting = hour < 12 ? t.greetingMorning : hour < 17 ? t.greetingAfternoon : t.greetingEvening

  const localeCode = lang === 'ar' ? 'ar-MA' : lang === 'fr' ? 'fr-FR' : 'en-US'
  const dateFormatted = new Intl.DateTimeFormat(localeCode, {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  }).format(new Date())

  return (
    <>
      <div className="dashboard-intro">
        <div>
          <h1>
            {greeting}, {firstName}
          </h1>
          <p>{dateFormatted}</p>
        </div>
      </div>

      <div className="dashboard-hero">
        <section aria-labelledby="free-heading" className="dashboard-free">
          <div className="flex items-center gap-2">
            <span
              className="dashboard-envelope-icon !h-7 !w-7"
              style={{ backgroundColor: envelopeMeta.free.tint, color: envelopeMeta.free.color }}
            >
              <ShoppingBag className="h-4 w-4" />
            </span>
            <h2 id="free-heading" className="text-sm font-bold text-[#29364A]">
              {t.freeToSpendHeading}
            </h2>
          </div>
          <p className="dashboard-free-amount">
            {money.format(freeBalance)} <span>MAD</span>
          </p>
          <p className="mt-4 text-sm text-[#62718A]">
            {t.setAsideRentTaxSavings.replace('{amount}', money.format(setAside))}
          </p>
          <p className="mt-1 text-sm text-[#8290A5]">
            {t.totalBalanceText.replace('{amount}', money.format(totalBalance))}
          </p>
          <p className="mt-5 flex items-start gap-2 text-sm text-[#66758D]">
            <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[#178449]" />
            {latest ? (
              <>
                +{money.format(latest.amount)} {lang === 'fr' ? 'de' : lang === 'ar' ? 'من' : 'from'} {latest.reference}
                {latest.created_at ? ` · ${date(latest.created_at)}` : ''}
              </>
            ) : payments.length ? (
              t.noProcessedPayments
            ) : (
              t.noPaymentsHomeNotice
            )}
          </p>
          <div className="mt-5 text-sm text-[#66758D]">
            <p className="flex items-start gap-2">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
              {activeRules > 0
                ? t.activeRulesCountReady.replace('{count}', String(activeRules))
                : t.setupRulesNotice}
            </p>
            <button
              type="button"
              onClick={() => onNavigate('rules')}
              className="mt-1 inline-flex items-center gap-1 font-semibold text-[#5963B6] ms-6"
            >
              {t.viewRulesAction} <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </section>

        {data.transactions.length === 0 ? (
          <div className="dashboard-empty-hero">
            <Payments payments={[]} onSelect={onSelectPayment} />
          </div>
        ) : (
          <section aria-labelledby="set-aside-heading" className="dashboard-set-aside">
            <h2 id="set-aside-heading" className="mb-2 text-sm font-bold text-[#29364A]">
              {t.setAsideHeading}
            </h2>
            {envelopeOrder.map((type) => (
              <EnvelopeRow key={type} type={type} data={data} />
            ))}
          </section>
        )}
      </div>

      <section className="dashboard-split-section" aria-labelledby="split-heading">
        <div className="dashboard-section-heading">
          <h2 id="split-heading">{historical ? t.lastPaymentSplitHeading : t.whatNextPaymentWillDo}</h2>
          {historical?.created_at && <span>{date(historical.created_at)}</span>}
          <button type="button" onClick={() => (historical ? onSelectPayment(historical) : onNavigate('sandbox'))}>
            {historical ? t.viewPaymentAction : t.tryAnAmountAction} <ArrowRight className="h-4 w-4" />
          </button>
        </div>
        <DashboardSplitRibbon
          amount={historical?.amount ?? previewAmount}
          allocations={ribbonAllocations}
          reference={historical?.reference}
          preview={!historical}
        />
        {!historical && (
          <p className="dashboard-preview-note">
            {t.previewAmountNote.replace('{amount}', money.format(previewAmount))}
          </p>
        )}
      </section>

      {data.transactions.length > 0 && (
        <section className="dashboard-recent" aria-labelledby="recent-heading">
          <div className="dashboard-section-heading">
            <h2 id="recent-heading">{t.recentPaymentsHeading}</h2>
            <button type="button" onClick={() => onNavigate('activity')}>
              {t.viewAllAction} <ArrowRight className="h-4 w-4" />
            </button>
          </div>
          <Payments payments={payments} onSelect={onSelectPayment} limit={5} />
        </section>
      )}
    </>
  )
}
