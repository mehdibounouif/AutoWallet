import { Pause, Pencil } from 'lucide-react'
import type { DashboardRule } from '../dashboardApi'
import { envelopeMeta, ruleDescription } from '../envelopeDisplay'
import { useTranslation } from '../../../i18n'
import { IconButton } from '../../../components/ui/Button'
import { Switch } from '../../../components/ui/Switch'
import { cn } from '../../../utils/cn'

/** One rule row with pause/resume and edit controls. */
export function RuleCard({ rule, index, disabled, onToggle, onEdit }: {
  rule: DashboardRule
  index: number
  disabled: boolean
  onToggle: (rule: DashboardRule) => void
  onEdit: (rule: DashboardRule) => void
}) {
  const { t } = useTranslation()
  const meta = envelopeMeta[rule.target_wallet]
  const Icon = meta.icon

  return (
    <article className="flex min-h-[86px] items-center gap-3 rounded-card border border-line bg-surface px-[18px] py-[15px]">
      <span className="grid size-[30px] shrink-0 place-items-center rounded-full bg-layer text-xs font-bold text-body">{index + 1}</span>
      <span
        className="grid size-10 shrink-0 place-items-center rounded-[9px]"
        style={{ backgroundColor: meta.tint, color: meta.color }}
        aria-hidden="true"
      >
        <Icon className="size-4" />
      </span>
      <div className={cn('min-w-0 flex-1', !rule.is_active && 'opacity-75')}>
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-extrabold text-body">{rule.name}</h3>
          {!rule.is_active && (
            <span className="inline-flex items-center gap-1 rounded bg-layer px-1.5 py-0.5 text-3xs font-bold text-muted">
              <Pause className="size-2.5" aria-hidden="true" />
              {t.ruleStatusPaused}
            </span>
          )}
        </div>
        <p className="mt-1 text-xs leading-snug text-muted">{ruleDescription(rule)}</p>
      </div>
      <div className="ms-auto flex items-center gap-3">
        <Switch
          checked={rule.is_active}
          onChange={() => onToggle(rule)}
          disabled={disabled}
          aria-label={`${rule.name} active`}
          label={rule.is_active ? t.ruleStatusActive : t.ruleStatusPaused}
          className="max-sm:[&>span:last-child]:hidden"
        />
        <IconButton
          label={`Edit ${rule.name}`}
          onClick={() => onEdit(rule)}
          disabled={disabled}
          className="size-11"
        >
          <Pencil className="size-4" aria-hidden="true" />
        </IconButton>
      </div>
    </article>
  )
}
