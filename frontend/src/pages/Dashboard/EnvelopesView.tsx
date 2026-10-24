import { Check } from 'lucide-react'
import type { DashboardRule, DashboardWallet, WalletType } from './dashboardApi'
import {
  envelopeChartColor,
  envelopeDescription,
  envelopeMeta,
  envelopeOrder,
  envelopeTarget,
  money,
  walletOrder,
} from './envelopeDisplay'
import { useTranslation } from '../../i18n'
import './envelopes.css'

interface EnvelopesViewProps {
  wallets: DashboardWallet[]
  rules: DashboardRule[]
  onSelect: (type: WalletType) => void
  busy?: boolean
}

const setAsideTypes: WalletType[] = ['rent', 'tax', 'savings']
const otherTypes: WalletType[] = ['free', 'main']

export function EnvelopesSkeleton() {
  return (
    <section className="envelopes-view envelopes-skeleton" aria-label="Loading envelopes" role="status">
      <div className="envelopes-page-heading">
        <div>
          <span className="envelopes-skeleton-line envelopes-skeleton-title" />
          <span className="envelopes-skeleton-line envelopes-skeleton-subtitle" />
        </div>
      </div>
      <div className="envelopes-overview">
        <div>
          <span className="envelopes-skeleton-line envelopes-skeleton-label" />
          <span className="envelopes-skeleton-line envelopes-skeleton-value" />
          <span className="envelopes-skeleton-line envelopes-skeleton-subtitle" />
        </div>
        <div>
          <span className="envelopes-skeleton-line envelopes-skeleton-bar" />
          <span className="envelopes-skeleton-line envelopes-skeleton-row" />
          <span className="envelopes-skeleton-line envelopes-skeleton-row" />
        </div>
      </div>
      <span className="envelopes-skeleton-line envelopes-skeleton-label" />
      <div className="envelopes-grid envelopes-grid--set-aside">
        {Array.from({ length: 3 }, (_, index) => (
          <div key={index} className="envelopes-skeleton-card">
            <span className="envelopes-skeleton-line envelopes-skeleton-label" />
            <span className="envelopes-skeleton-line envelopes-skeleton-value" />
            <span className="envelopes-skeleton-line envelopes-skeleton-row" />
          </div>
        ))}
      </div>
      <span className="sr-only">Loading envelopes</span>
    </section>
  )
}

export function EnvelopesView({ wallets, rules, onSelect }: EnvelopesViewProps) {
  const { t } = useTranslation()
  const balances = new Map<WalletType, number>(wallets.map((wallet) => [wallet.wallet_type, wallet.balance]))
  const total = walletOrder.reduce((sum, type) => sum + (balances.get(type) ?? 0), 0)
  const setAsideTotal = envelopeOrder.reduce((sum, type) => sum + (balances.get(type) ?? 0), 0)
  const freeBalance = balances.get('free') ?? 0

  return (
    <section className="envelopes-view" aria-labelledby="envelopes-heading">
      <div className="envelopes-page-heading">
        <div>
          <h1 id="envelopes-heading">{t.envelopesMainHeading}</h1>
          <p>{t.envelopesMainSubtitle}</p>
        </div>
      </div>

      <section className="envelopes-overview" aria-label={t.totalAcrossEnvelopes}>
        <div className="envelopes-overview-total">
          <p>{t.totalAcrossEnvelopes}</p>
          <strong>
            {money.format(total)} <small>MAD</small>
          </strong>
          <span>
            {t.setAsideHeading} {money.format(setAsideTotal)} · {envelopeMeta.free.name} {money.format(freeBalance)}
          </span>
        </div>

        <div>
          <div className="envelopes-allocation-bar" role="img" aria-label={t.balanceAllocationByEnvelope}>
            {walletOrder.map((type) => {
              const balance = balances.get(type) ?? 0
              const width = total > 0 ? Math.max(0, (balance / total) * 100) : 0
              if (width <= 0) return null
              return (
                <span
                  key={type}
                  style={{ width: `${width}%`, backgroundColor: envelopeChartColor(type) }}
                  title={`${envelopeMeta[type].name}: ${money.format(balance)} MAD`}
                />
              )
            })}
          </div>
          <div className="envelopes-allocation-list">
            {walletOrder.map((type) => {
              const balance = balances.get(type) ?? 0
              const share = total > 0 ? Math.round((balance / total) * 100) : 0
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => onSelect(type)}
                  className="envelopes-allocation-row"
                >
                  <span className="envelopes-allocation-name">
                    <span
                      className="h-2 w-2 shrink-0 rounded-full"
                      style={{ backgroundColor: envelopeChartColor(type) }}
                      aria-hidden="true"
                    />
                    <span>{envelopeMeta[type].name}</span>
                  </span>
                  <strong>{money.format(balance)}</strong>
                  <span>{share}%</span>
                </button>
              )
            })}
          </div>
        </div>
      </section>

      <div className="envelopes-section">
        <div className="envelopes-section-heading">
          <h2>{t.setAsideHeading}</h2>
          <span>{t.setAsideSubhead}</span>
        </div>
        <div className="envelopes-grid envelopes-grid--set-aside">
          {setAsideTypes.map((type) => (
            <EnvelopeCard
              key={type}
              type={type}
              balance={balances.get(type) ?? 0}
              total={total}
              rules={rules}
              onSelect={onSelect}
            />
          ))}
        </div>
      </div>

      <div className="envelopes-section">
        <div className="envelopes-section-heading">
          <h2>{t.otherSectionTitle}</h2>
          <span>{t.otherSubhead}</span>
        </div>
        <div className="envelopes-grid envelopes-grid--other">
          {otherTypes.map((type) => (
            <EnvelopeCard
              key={type}
              type={type}
              balance={balances.get(type) ?? 0}
              total={total}
              rules={rules}
              onSelect={onSelect}
            />
          ))}
        </div>
      </div>
    </section>
  )
}

function EnvelopeCard({
  type,
  balance,
  total,
  rules,
  onSelect,
}: {
  type: WalletType
  balance: number
  total: number
  rules: DashboardRule[]
  onSelect: (type: WalletType) => void
}) {
  const { t, lang } = useTranslation()
  const meta = envelopeMeta[type]
  const Icon = meta.icon
  const target = envelopeTarget(type, rules)
  const percent = target ? Math.min(100, Math.round((balance / target) * 100)) : null
  const remaining = target ? Math.max(0, target - balance) : null
  const share = total > 0 ? ((balance / total) * 100).toFixed(1) : '0.0'

  return (
    <button
      type="button"
      onClick={() => onSelect(type)}
      className={`envelopes-card envelopes-card--${type}`}
      aria-label={t.openEnvelopeAria.replace('{name}', meta.name).replace('{amount}', money.format(balance))}
    >
      <span className="envelopes-card-heading">
        <span className="envelopes-card-icon" style={{ backgroundColor: meta.tint, color: meta.color }} aria-hidden="true">
          <Icon className="h-4 w-4" />
        </span>
        <span>
          <strong>{meta.name}</strong>
          <small>{envelopeDescription(type, rules)}</small>
        </span>
      </span>

      <strong className="envelopes-card-value">
        {money.format(balance)} <small>MAD</small>
      </strong>

      {target !== null && percent !== null && (
        <span className="envelopes-card-progress">
          <span
            className="envelopes-card-track"
            role="progressbar"
            aria-label={`${meta.name} target progress`}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={percent}
          >
            <span style={{ width: `${percent}%`, backgroundColor: meta.color }} />
          </span>
          <span className="envelopes-card-progress-caption">
            {percent >= 100 ? (
              <>
                <Check className="h-3.5 w-3.5" aria-hidden="true" />
                {t.targetMetBadge} · {money.format(target)}
              </>
            ) : (
              <>
                {type === 'savings' ? t.capWord : t.targetWord} {money.format(target)} · {money.format(remaining ?? 0)} {lang === 'ar' ? 'متبقٍ' : lang === 'fr' ? 'restants' : 'to go'} ({percent}%)
              </>
            )}
          </span>
        </span>
      )}

      {type === 'tax' && target === null && (
        <span className="envelopes-card-footnote">
          {lang === 'fr' ? 'Sans plafond · croît à chaque paiement' : lang === 'ar' ? 'بدون حد أقصى · ينمو مع كل دفعة' : 'No cap · grows with every payment'}
        </span>
      )}
      {type === 'free' && (
        <span className="envelopes-card-footnote">
          {share}% {lang === 'fr' ? 'de votre solde total' : lang === 'ar' ? 'من إجمالي رصيدك' : 'of your total balance'}
        </span>
      )}
      {type === 'main' && (
        <span className="envelopes-card-footnote">
          0% {lang === 'fr' ? 'quand Libre à dépenser prend 100 %' : lang === 'ar' ? 'عندما يأخذ حر للتصرف 100%' : 'when Free to spend takes 100%'}
        </span>
      )}
    </button>
  )
}
