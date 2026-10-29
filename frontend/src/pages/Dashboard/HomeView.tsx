import { useMemo } from 'react'
import { ArrowRight, ShieldCheck, ShoppingBag } from 'lucide-react'
import type { DashboardData, DashboardTransaction } from './dashboardApi'
import { DashboardSplitRibbon } from './DashboardSplitRibbon'
import { envelopeMeta, envelopeOrder, money } from './envelopeDisplay'
import { paymentDate } from './paymentUtils'
import { useTranslation } from '../../i18n'
import { HomeEnvelopeRow } from './home/HomeEnvelopeRow'
import { HomePayments } from './home/HomePayments'
import { buildHomeModel, PREVIEW_AMOUNT } from './home/homeModel'

interface HomeViewProps {
  data: DashboardData
  onNavigate: (view: 'sandbox' | 'rules' | 'activity') => void
  onSelectPayment: (payment: DashboardTransaction) => void
}

export function HomeView({ data, onNavigate, onSelectPayment }: HomeViewProps) {
  const { t, lang } = useTranslation()
  const model = useMemo(() => buildHomeModel(data, lang), [data, lang])
  const hour = new Date().getHours()
  const greeting = hour < 12 ? t.greetingMorning : hour < 17 ? t.greetingAfternoon : t.greetingEvening

  return (
    <>
      <div className="flex items-start justify-between gap-5">
        <div>
          <h1 className="text-[21px] font-extrabold tracking-[-0.025em] text-ink max-md:text-[19px]">
            {greeting}, {model.firstName}
          </h1>
          <p className="mt-1 text-[13px] text-subtle max-md:text-xs">{model.dateFormatted}</p>
        </div>
      </div>

      <div className="mt-[31px] grid grid-cols-[minmax(0,0.77fr)_minmax(0,1fr)] gap-9 max-[1050px]:gap-7 max-md:mt-9 max-md:block">
        <section aria-labelledby="free-heading">
          <div className="flex items-center gap-2">
            <span
              className="grid size-7 place-items-center rounded-[9px]"
              style={{ backgroundColor: envelopeMeta.free.tint, color: envelopeMeta.free.color }}
              aria-hidden="true"
            >
              <ShoppingBag className="size-4" />
            </span>
            <h2 id="free-heading" className="text-sm font-bold text-body">{t.freeToSpendHeading}</h2>
          </div>
          <p className="mt-3 text-[clamp(34px,3.35vw,52px)] leading-none font-extrabold tracking-[-0.045em] whitespace-nowrap text-ink max-md:text-[clamp(34px,9vw,43px)]">
            {money.format(model.freeBalance)} <span className="text-[15px] tracking-normal text-muted max-md:text-xs">MAD</span>
          </p>
          <p className="mt-4 text-sm text-muted max-md:mt-4 max-md:text-xs">
            {t.setAsideRentTaxSavings.replace('{amount}', money.format(model.setAside))}
          </p>
          <p className="mt-1 text-sm text-subtle max-md:text-xs">
            {t.totalBalanceText.replace('{amount}', money.format(model.totalBalance))}
          </p>
          <p className="mt-5 flex items-start gap-2 text-sm text-muted max-md:text-xs">
            <span className="mt-1.5 size-2 shrink-0 rounded-full bg-success" aria-hidden="true" />
            {model.latest ? (
              <>
                +{money.format(model.latest.amount)} {t.fromWord} {model.latest.reference}
                {model.latest.created_at ? ` · ${paymentDate(model.latest.created_at)}` : ''}
              </>
            ) : data.transactions.length ? (
              t.noProcessedPayments
            ) : (
              t.noPaymentsHomeNotice
            )}
          </p>
          <div className="mt-5 text-sm text-muted max-md:text-xs">
            <p className="flex items-start gap-2">
              <ShieldCheck className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              {model.activeRules > 0
                ? t.activeRulesCountReady.replace('{count}', String(model.activeRules))
                : t.setupRulesNotice}
            </p>
            <button
              type="button"
              onClick={() => onNavigate('rules')}
              className="mt-1 ms-6 inline-flex items-center gap-1 font-semibold text-accent hover:underline"
            >
              {t.viewRulesAction} <ArrowRight className="size-4" aria-hidden="true" />
            </button>
          </div>
        </section>

        {data.transactions.length === 0 ? (
          <HomePayments payments={[]} onSelect={onSelectPayment} />
        ) : (
          <section aria-labelledby="set-aside-heading" className="max-md:mt-[60px]">
            <h2 id="set-aside-heading" className="mb-2 text-sm font-bold text-body">{t.setAsideHeading}</h2>
            {envelopeOrder.map((type) => <HomeEnvelopeRow key={type} type={type} data={data} />)}
          </section>
        )}
      </div>

      <section className="mt-5 max-md:mt-8" aria-labelledby="split-heading">
        <div className="mb-5 flex items-center gap-3 max-md:mb-3.5">
          <h2 id="split-heading" className="text-base font-extrabold text-ink max-md:text-[15px]">
            {model.historical ? t.lastPaymentSplitHeading : t.whatNextPaymentWillDo}
          </h2>
          {model.historical?.created_at && <span className="text-xs text-muted">{paymentDate(model.historical.created_at)}</span>}
          <button
            type="button"
            onClick={() => (model.historical ? onSelectPayment(model.historical) : onNavigate('sandbox'))}
            className="ms-auto inline-flex items-center gap-1 text-xs font-bold text-accent hover:underline"
          >
            {model.historical ? t.viewPaymentAction : t.tryAnAmountAction} <ArrowRight className="size-4" aria-hidden="true" />
          </button>
        </div>
        <DashboardSplitRibbon
          amount={model.historical?.amount ?? PREVIEW_AMOUNT}
          allocations={model.ribbonAllocations}
          reference={model.historical?.reference}
          preview={!model.historical}
        />
        {!model.historical && (
          <p className="mt-3 text-2xs text-subtle">
            {t.previewAmountNote.replace('{amount}', money.format(PREVIEW_AMOUNT))}
          </p>
        )}
      </section>

      {data.transactions.length > 0 && (
        <section className="mt-16 max-md:mt-9" aria-labelledby="recent-heading">
          <div className="mb-5 flex items-center gap-3 max-md:mb-3.5">
            <h2 id="recent-heading" className="text-base font-extrabold text-ink max-md:text-[15px]">{t.recentPaymentsHeading}</h2>
            <button
              type="button"
              onClick={() => onNavigate('activity')}
              className="ms-auto inline-flex items-center gap-1 text-xs font-bold text-accent hover:underline"
            >
              {t.viewAllAction} <ArrowRight className="size-4" aria-hidden="true" />
            </button>
          </div>
          <HomePayments payments={data.transactions} onSelect={onSelectPayment} limit={5} />
        </section>
      )}
    </>
  )
}
