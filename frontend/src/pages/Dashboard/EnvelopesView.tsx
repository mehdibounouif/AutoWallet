import type { DashboardRule, DashboardWallet, WalletType } from './dashboardApi'
import { envelopeChartColor, envelopeMeta, envelopeOrder, money, walletOrder } from './envelopeDisplay'
import { useTranslation } from '../../i18n'
import { Card } from '../../components/ui/Card'
import { Page } from '../../components/ui/Page'
import { PageHeader } from '../../components/ui/PageHeader'
import { EnvelopeCard } from './envelopes/EnvelopeCard'

interface EnvelopesViewProps {
  wallets: DashboardWallet[]
  rules: DashboardRule[]
  onSelect: (type: WalletType) => void
  busy?: boolean
}

const setAsideTypes: WalletType[] = ['rent', 'tax', 'savings']
const otherTypes: WalletType[] = ['free', 'main']

export function EnvelopesView({ wallets, rules, onSelect }: EnvelopesViewProps) {
  const { t } = useTranslation()
  const balances = new Map<WalletType, number>(wallets.map((wallet) => [wallet.wallet_type, wallet.balance]))
  const total = walletOrder.reduce((sum, type) => sum + (balances.get(type) ?? 0), 0)
  const setAsideTotal = envelopeOrder.reduce((sum, type) => sum + (balances.get(type) ?? 0), 0)
  const freeBalance = balances.get('free') ?? 0

  return (
    <Page as="section" aria-labelledby="envelopes-heading">
      <PageHeader id="envelopes-heading" title={t.envelopesMainHeading} description={t.envelopesMainSubtitle} />

      <Card className="grid min-h-[198px] grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] items-center gap-7 p-[22px] max-[980px]:grid-cols-1 max-[980px]:gap-6" aria-label={t.totalAcrossEnvelopes}>
        <div>
          <p className="text-xs font-semibold text-muted">{t.totalAcrossEnvelopes}</p>
          <strong className="mt-3 block text-[28px] font-extrabold tracking-[-0.04em] whitespace-nowrap text-ink max-md:mt-1.5 max-md:text-[23px]">
            {money.format(total)} <small className="text-2xs font-bold tracking-normal text-muted">MAD</small>
          </strong>
          <span className="mt-3.5 block text-xs leading-normal text-muted max-md:mt-2 max-md:text-2xs">
            {t.setAsideHeading} {money.format(setAsideTotal)} · {envelopeMeta.free.name} {money.format(freeBalance)}
          </span>
        </div>

        <div>
          <div
            className="flex h-[27px] w-full overflow-hidden rounded bg-layer-strong max-md:h-[17px]"
            role="img"
            aria-label={t.balanceAllocationByEnvelope}
          >
            {walletOrder.map((type) => {
              const balance = balances.get(type) ?? 0
              const width = total > 0 ? Math.max(0, (balance / total) * 100) : 0
              if (width <= 0) return null
              return (
                <span
                  key={type}
                  style={{ width: `${width}%`, backgroundColor: envelopeChartColor(type) }}
                  title={`${envelopeMeta[type].name}: ${money.format(balance)} MAD`}
                  className="border-s-2 border-white first:border-s-0"
                />
              )
            })}
          </div>
          <div className="mt-2">
            {walletOrder.map((type) => {
              const balance = balances.get(type) ?? 0
              const share = total > 0 ? Math.round((balance / total) * 100) : 0
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => onSelect(type)}
                  aria-label={`${envelopeMeta[type].name}, ${money.format(balance)} MAD, ${share}%`}
                  className="grid min-h-[26px] w-full grid-cols-[minmax(0,1fr)_94px_50px] items-center gap-3 rounded px-1 py-0.5 text-start text-xs hover:bg-canvas max-md:min-h-6 max-md:grid-cols-[minmax(0,1fr)_83px_43px] max-md:gap-2 max-md:text-2xs"
                >
                  <span className="inline-flex min-w-0 items-center gap-1.5">
                    <span className="size-2 shrink-0 rounded-full" style={{ backgroundColor: envelopeChartColor(type) }} aria-hidden="true" />
                    <span className="truncate text-muted">{envelopeMeta[type].name}</span>
                  </span>
                  <strong className="text-end text-xs font-bold text-ink tabular-nums max-md:text-2xs">{money.format(balance)}</strong>
                  <span className="text-end text-muted tabular-nums">{share}%</span>
                </button>
              )
            })}
          </div>
        </div>
      </Card>

      <div className="mt-[22px] max-md:mt-6">
        <div className="mb-3 flex items-baseline gap-3 max-md:block">
          <h2 className="text-sm font-extrabold text-body">{t.setAsideHeading}</h2>
          <span className="text-xs text-subtle max-md:mt-0.5 max-md:block max-md:text-2xs">{t.setAsideSubhead}</span>
        </div>
        <div className="grid grid-cols-3 gap-5 max-[980px]:gap-3 max-md:grid-cols-1">
          {setAsideTypes.map((type) => (
            <EnvelopeCard key={type} type={type} balance={balances.get(type) ?? 0} total={total} rules={rules} onSelect={onSelect} />
          ))}
        </div>
      </div>

      <div className="mt-[22px] max-md:mt-6">
        <div className="mb-3 flex items-baseline gap-3 max-md:block">
          <h2 className="text-sm font-extrabold text-body">{t.otherSectionTitle}</h2>
          <span className="text-xs text-subtle max-md:mt-0.5 max-md:block max-md:text-2xs">{t.otherSubhead}</span>
        </div>
        <div className="grid grid-cols-2 gap-5 max-[980px]:gap-3 max-md:grid-cols-1">
          {otherTypes.map((type) => (
            <EnvelopeCard key={type} type={type} balance={balances.get(type) ?? 0} total={total} rules={rules} onSelect={onSelect} />
          ))}
        </div>
      </div>
    </Page>
  )
}
