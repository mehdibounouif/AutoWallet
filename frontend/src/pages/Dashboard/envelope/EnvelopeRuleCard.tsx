import { ArrowRight } from 'lucide-react'
import type { DashboardRule, WalletType } from '../dashboardApi'
import { envelopeMeta, ruleDescription } from '../envelopeDisplay'
import { useTranslation } from '../../../i18n'
import { Card } from '../../../components/ui/Card'
import { cn } from '../../../utils/cn'

/** Rule card explaining how the selected envelope is funded. */
export function EnvelopeRuleCard({ type, rule, onOpenRules }: {
  type: WalletType
  rule: DashboardRule | undefined
  onOpenRules: () => void
}) {
  const { t } = useTranslation()
  const meta = envelopeMeta[type]
  const Icon = meta.icon

  return (
    <Card as="section" className="min-h-[275px] p-6 max-md:min-h-0 max-md:p-4" aria-labelledby="envelope-rule-heading">
      <h2 id="envelope-rule-heading" className="text-base font-extrabold text-ink max-md:text-[15px]">
        {t.envelopeRuleTitle}
      </h2>
      {rule ? (
        <>
          <div className="mt-4 flex items-start gap-3 rounded-[13px] border border-line p-4 max-md:mt-3 max-md:gap-[7px] max-md:px-2.5 max-md:py-3">
            <span className="grid size-[27px] shrink-0 place-items-center rounded-full bg-layer text-xs font-extrabold text-body max-md:size-[25px]">
              {rule.priority}
            </span>
            <span
              className="grid size-[38px] shrink-0 place-items-center rounded-[9px] max-md:size-[34px]"
              style={{ backgroundColor: meta.tint, color: meta.color }}
              aria-hidden="true"
            >
              <Icon className="size-4" />
            </span>
            <div className="min-w-0 flex-1">
              <strong className="block text-[13px] font-extrabold text-body break-words">{rule.name}</strong>
              <p className="mt-1 text-xs leading-snug text-muted break-words max-md:text-2xs">{ruleDescription(rule)}</p>
            </div>
            <span className={cn('inline-flex shrink-0 items-center gap-2 text-xs whitespace-nowrap text-muted max-md:flex-col max-md:gap-1 max-md:text-3xs', rule.is_active && 'text-body')}>
              <span
                className={cn(
                  "relative h-5 w-[35px] rounded-full bg-line-strong after:absolute after:left-[3px] after:top-[3px] after:size-3.5 after:rounded-full after:bg-white after:content-['']",
                  rule.is_active && 'bg-action-primary after:translate-x-[15px] max-md:after:translate-x-3.5',
                  'max-md:after:left-[3px] max-md:after:top-[3px]',
                  'max-md:h-[18px] max-md:w-8 max-md:after:size-3',
                )}
                aria-hidden="true"
              />
              {rule.is_active ? t.ruleStatusActive : t.ruleStatusPaused}
            </span>
          </div>
          <button type="button" onClick={onOpenRules} className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-accent hover:underline">
            {t.viewRulesAction}
            <ArrowRight className="size-3.5" aria-hidden="true" />
          </button>
        </>
      ) : (
        <p className="mt-5 text-[13px] text-muted">
          {t.noRuleForEnvelope}
        </p>
      )}
    </Card>
  )
}
