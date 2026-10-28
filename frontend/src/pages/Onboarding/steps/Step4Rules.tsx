import { Home, Info, Landmark, PiggyBank, Wallet } from 'lucide-react'
import type { Translations } from '../../../i18n'
import { Alert } from '../../../components/ui/Alert'
import { Card } from '../../../components/ui/Card'
import { RuleValueInput } from '../components/RuleValueInput'
import { TokenEnvelopePill } from '../components/TokenEnvelopePill'

interface Step4RulesProps {
  rentAmount: string
  setRentAmount: (value: string) => void
  taxPercent: string
  setTaxPercent: (value: string) => void
  savingsPercent: string
  setSavingsPercent: (value: string) => void
  savingsCap: string
  setSavingsCap: (value: string) => void
  t: Translations
}

export function Step4Rules({
  rentAmount,
  setRentAmount,
  taxPercent,
  setTaxPercent,
  savingsPercent,
  setSavingsPercent,
  savingsCap,
  setSavingsCap,
  t,
}: Step4RulesProps) {
  const pill = { icon: PiggyBank, color: '#1baf7a', bgColor: '#e3f5ee' }

  return (
    <div className="mx-auto w-full max-w-[680px] space-y-5 px-2 sm:px-4">
      <div className="mb-6 space-y-1.5">
        <h1 className="text-2xl font-semibold tracking-tight text-ink sm:text-[28px]">{t.rulesTitle}</h1>
        <p className="text-[15px] leading-relaxed text-muted sm:text-base">{t.rulesSubtitle}</p>
      </div>

      <div className="space-y-3.5">
        <Card className="space-y-3 p-4 sm:p-5">
          <h2 className="text-sm font-semibold text-ink sm:text-base">{t.rule1Title}</h2>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-3 text-sm leading-relaxed text-ink sm:text-base">
            <span>{t.rule1Lock}</span>
            <RuleValueInput id="rule1-token-amount-1" label={t.rule1Title} value={rentAmount} onChange={setRentAmount} unit="MAD" />
            <span>{t.rule1Into}</span>
            <TokenEnvelopePill name={t.rentName} icon={Home} color="#2270d8" bgColor="#eaf2fc" />
          </div>
        </Card>

        <Card className="space-y-3 p-4 sm:p-5">
          <h2 className="text-sm font-semibold text-ink sm:text-base">{t.rule2Title}</h2>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-3 text-sm leading-relaxed text-ink sm:text-base">
            <span>{t.rule2Put}</span>
            <RuleValueInput id="rule2-token-tax" label={t.rule2Title} value={taxPercent} onChange={setTaxPercent} unit="%" />
            <span>{t.rule2OfWhatLeftInto}</span>
            <TokenEnvelopePill name={t.taxName} icon={Landmark} color="#eb6834" bgColor="#fdeee8" />
          </div>
        </Card>

        <Card className="space-y-3 p-4 sm:p-5">
          <h2 className="text-sm font-semibold text-ink sm:text-base">{t.rule3Title}</h2>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-3 text-sm leading-relaxed text-ink sm:text-base">
            <span>{t.rule3Put}</span>
            <RuleValueInput id="rule3-token-percent" label={t.rule3Title} value={savingsPercent} onChange={setSavingsPercent} unit="%" />
            <span>{t.rule3OfWhatLeftInto}</span>
            <TokenEnvelopePill name={t.savingsName} {...pill} />
            <span>{t.rule3OnlyWhile}</span>
            <TokenEnvelopePill name={t.savingsName} {...pill} />
            <span>{t.rule3IsBelow}</span>
            <RuleValueInput id="rule3-token-cap" label={`${t.savingsName} ${t.rule3IsBelow}`} value={savingsCap} onChange={setSavingsCap} unit="MAD" />
          </div>
        </Card>

        <Card className="space-y-1 p-4 sm:p-5">
          <h2 className="text-sm font-semibold text-ink sm:text-base">{t.rule4Title}</h2>
          <p className="text-sm text-muted sm:text-base">{t.rule4Gets}</p>
        </Card>

        <div className="flex items-start gap-3.5 rounded-2xl border border-dashed border-line-strong bg-canvas p-4 sm:items-center sm:p-5">
          <span className="grid size-10 shrink-0 place-items-center rounded-[10px] bg-layer text-muted">
            <Wallet className="size-5" aria-hidden="true" />
          </span>
          <p className="text-xs leading-relaxed text-brand-navy sm:text-sm">
            <span className="font-semibold text-ink">{t.leftoverMainTitle}</span> — {t.leftoverMainDesc}
          </p>
        </div>

        <Alert tone="brand" icon={<Info className="size-5" />}>
          <p className="text-xs leading-snug sm:text-sm">{t.taxDisclaimer}</p>
        </Alert>
      </div>
    </div>
  )
}
