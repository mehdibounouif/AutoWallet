import { useState } from 'react'
import { Card } from '../../components/ui/Card'
import { Page } from '../../components/ui/Page'
import { PageHeader } from '../../components/ui/PageHeader'
import type { DashboardData, DashboardRule, RuleDraft } from './dashboardApi'
import { envelopeMeta } from './envelopeDisplay'
import { useTranslation } from '../../i18n'
import { RulePreview } from './rules/RulePreview'
import { RuleCard } from './rules/RuleCard'
import { RuleEditorDialog } from './rules/RuleEditorDialog'

interface RulesViewProps {
  data: DashboardData
  busy: boolean
  onUpdateRule?: (ruleId: string, updates: Partial<RuleDraft>) => Promise<void>
}

export function RulesView({ data, busy, onUpdateRule }: RulesViewProps) {
  const { t } = useTranslation()
  const [editingRule, setEditingRule] = useState<DashboardRule | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const sortedRules = [...data.rules].sort((a, b) => a.priority - b.priority || a.id.localeCompare(b.id))
  const mainMeta = envelopeMeta.main
  const MainIcon = mainMeta.icon

  const handleToggleActive = async (rule: DashboardRule) => {
    if (!onUpdateRule) return
    try {
      await onUpdateRule(rule.id, { is_active: !rule.is_active })
      setNotice(`${rule.name} is now ${!rule.is_active ? 'active' : 'paused'}.`)
    } catch (reason) {
      setNotice(reason instanceof Error ? reason.message : 'Could not update rule status.')
    }
  }

  const saveRule = async (updates: Partial<RuleDraft>) => {
    if (!editingRule || !onUpdateRule) return
    await onUpdateRule(editingRule.id, updates)
    setNotice(`Updated "${updates.name ?? editingRule.name}".`)
  }

  return (
    <Page as="section" aria-labelledby="rules-heading">
      <PageHeader id="rules-heading" title={t.rulesHeading} description={t.rulesSubheading} className="mb-7" />

      {notice && (
        <p className="-mt-2 mb-4 rounded-lg bg-success-soft px-3.5 py-2.5 text-xs text-success-ink" role="status">
          {notice}
        </p>
      )}

      <RulePreview data={data} />

      <div className="mt-8 grid gap-3">
        {sortedRules.length > 0 ? (
          sortedRules.map((rule, index) => (
            <RuleCard
              key={rule.id}
              rule={rule}
              index={index}
              disabled={busy || !onUpdateRule}
              onToggle={(item) => void handleToggleActive(item)}
              onEdit={setEditingRule}
            />
          ))
        ) : (
          <Card className="flex min-h-[230px] flex-col items-center justify-center p-6 text-center">
            <div className="relative mb-3.5 h-[62px] w-[90px]" aria-hidden="true">
              <span className="absolute start-2 top-0 block h-[18px] w-[78px] rounded-full border-2 border-[#6576be] bg-brand-primary" />
              <span className="absolute start-2 top-[13px] block h-[18px] w-[62px] rounded-full border-2 border-[#6576be] bg-[#e7eaf7]" />
              <span className="absolute start-2 top-[26px] block h-[18px] w-[48px] rounded-full border-2 border-[#6576be] bg-surface" />
            </div>
            <strong className="text-sm font-bold text-body">No rules yet — payments will stay in Main.</strong>
            <p className="mt-1.5 text-xs text-muted">Rules split payments into your envelopes automatically.</p>
          </Card>
        )}

        <div className="mt-3 flex min-h-[84px] items-center gap-3 rounded-card border border-dashed border-line-strong px-[78px] py-[15px] max-md:px-4">
          <span
            className="grid size-10 shrink-0 place-items-center rounded-[9px]"
            style={{ backgroundColor: mainMeta.tint, color: mainMeta.color }}
            aria-hidden="true"
          >
            <MainIcon className="size-4" />
          </span>
          <div>
            <strong className="text-sm font-bold text-body">Main</strong>
            <p className="mt-1 text-xs leading-snug text-muted">
              Anything the rules above don&apos;t take stays in Main. Currently 0% because Free to spend takes 100% of what&apos;s left.
            </p>
          </div>
        </div>
      </div>

      {editingRule && (
        <RuleEditorDialog
          key={editingRule.id}
          rule={editingRule}
          onClose={() => setEditingRule(null)}
          onSave={saveRule}
        />
      )}
    </Page>
  )
}
