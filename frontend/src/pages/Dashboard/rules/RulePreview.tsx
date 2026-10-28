import type { DashboardData } from '../dashboardApi'
import { Card } from '../../../components/ui/Card'
import { DashboardSplitRibbon } from '../DashboardSplitRibbon'
import { money } from '../../../utils/format'
import { SAMPLE_AMOUNT, buildRulePreview, previewExplanation } from './rulePreviewModel'

/** Live sample split used to explain rule priority. */
export function RulePreview({ data }: { data: DashboardData }) {
  const { allocations, subtexts } = buildRulePreview(data)

  return (
    <Card as="section" className="px-6 pt-6 pb-5" aria-labelledby="rules-preview-heading">
      <div className="mb-6 flex items-baseline justify-between gap-4">
        <h2 id="rules-preview-heading" className="text-base font-extrabold text-ink break-words">
          How a {money.format(SAMPLE_AMOUNT)} MAD payment splits right now
        </h2>
        <span className="text-2xs text-subtle">Updates as you edit</span>
      </div>
      <DashboardSplitRibbon
        amount={SAMPLE_AMOUNT}
        allocations={allocations}
        preview
        previewLabel="Sample payment"
        branchNotes={subtexts}
        size="large"
      />
      <p className="mt-4 text-center text-xs leading-relaxed text-muted break-words">{previewExplanation(data, allocations)}</p>
    </Card>
  )
}
