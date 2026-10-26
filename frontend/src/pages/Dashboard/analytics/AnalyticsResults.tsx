import { useMemo } from 'react'
import { BarChart3 } from 'lucide-react'
import type { AnalyticsData, AnalyticsFilters } from '../../../api/analyticsApi'
import type { DashboardData } from '../dashboardApi'
import { EmptyState } from '../../../components/ui/EmptyState'
import { money } from '../../../utils/format'
import { AnalyticsDetails } from './AnalyticsDetails'
import { AnalyticsOverview } from './AnalyticsOverview'
import { AnalyticsSuggestions } from './AnalyticsSuggestions'
import { buildAnalyticsModel } from './analyticsModel'

interface AnalyticsResultsProps {
  report: AnalyticsData
  data: DashboardData
  filters: AnalyticsFilters
  onAsk: (question: string) => void
  onRules: () => void
  onRefresh: () => void
}

/** Composes the analytics report into overview, suggestions and chart sections. */
export function AnalyticsResults({ report, data, filters, onAsk, onRules, onRefresh }: AnalyticsResultsProps) {
  const model = useMemo(() => buildAnalyticsModel(report, data, filters), [report, data, filters])

  if (!model.paymentCount) {
    return (
      <EmptyState
        icon={<BarChart3 />}
        title="No payments in this period"
        description={filters.envelope
          ? 'No processed payments with a saved allocation to this envelope were found. Try another envelope or period.'
          : 'Try another period to see where your income goes.'}
      />
    )
  }

  return (
    <>
      {model.missing > 0.02 && (
        <p className="mb-4 text-xs text-muted">
          {money.format(model.missing)} MAD of this income has no saved split. Allocation charts show only the allocations that were recorded.
        </p>
      )}
      <AnalyticsOverview model={model} onRefresh={onRefresh} />
      <AnalyticsSuggestions suggestions={model.suggestions} onAsk={onAsk} onRules={onRules} />
      <AnalyticsDetails model={model} />
    </>
  )
}
