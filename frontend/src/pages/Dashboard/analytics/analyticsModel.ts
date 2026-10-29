import type { AnalyticsData, AnalyticsFilters, AnalyticsPoint } from '../../../api/analyticsApi'
import type { DashboardData, DashboardTransaction, WalletType } from '../dashboardApi'
import { envelopeTarget, walletOrder } from '../envelopeDisplay'
import { money } from '../../../utils/format'
import { pointLabel } from './analyticsDates'

export interface ChartPoint extends AnalyticsPoint {
  label: string
}

export interface CumulativePoint extends ChartPoint {
  values: Partial<Record<WalletType, number>>
}

export interface HistogramBin {
  lower: number
  upper: number
  count: number
}

export type SuggestionId = 'tax' | 'cap' | 'rent' | 'largest'

export interface Suggestion {
  id: SuggestionId
  title: string
  text: string
  question: string
}

export interface AnalyticsModel {
  types: WalletType[]
  total: number
  average: number
  largestPayment: number
  paymentCount: number
  allocations: Partial<Record<WalletType, number>>
  allocationTotal: number
  missing: number
  points: ChartPoint[]
  cumulative: CumulativePoint[]
  maxAllocation: number
  rentBalance: number
  tax: number
  savings: number
  rent: number
  cap: number | null
  taxRate: number | null
  expectedTax: number | null
  coverage: number | null
  healthScore: number
  healthStatus: string
  healthColor: string
  payments: DashboardTransaction[]
  detailed: boolean
  detailMissing: string
  deviation: number
  incomeMax: number
  minimum: number
  histogram: HistogramBin[]
  maxCount: number
  suggestions: Suggestion[]
}

/** All derived analytics values in one testable function. */
export function buildAnalyticsModel(report: AnalyticsData, data: DashboardData, filters: AnalyticsFilters): AnalyticsModel {
  const { summary, timeseries } = report
  const types: WalletType[] = filters.envelope ? [filters.envelope] : walletOrder
  const total = summary.received
  const average = summary.average_payment
  const allocations = summary.by_envelope
  const allocationTotal = types.reduce((sum, type) => sum + (allocations[type] ?? 0), 0)
  const missing = filters.envelope ? 0 : Math.max(0, total - allocationTotal)
  const points: ChartPoint[] = timeseries.points.map((point) => ({
    ...point,
    label: pointLabel(point.period, filters.interval),
  }))

  const running: Partial<Record<WalletType, number>> = {}
  const cumulative: CumulativePoint[] = points.map((point) => {
    for (const type of types) running[type] = (running[type] ?? 0) + (point.envelopes[type] ?? 0)
    return { ...point, values: { ...running } }
  })
  const maxAllocation = Math.max(1, ...types.map((type) => allocations[type] ?? 0))

  const balances = Object.fromEntries(data.wallets.map((wallet) => [wallet.wallet_type, wallet.balance]))
  const rentBalance = summary.balances.rent ?? balances.rent ?? 0
  const tax = summary.balances.tax ?? balances.tax ?? 0
  const savings = summary.balances.savings ?? balances.savings ?? 0
  const rent = data.rules.find((rule) => rule.is_active && rule.target_wallet === 'rent' && rule.rule_type === 'lock_fixed')?.fixed_amount ?? 0
  const cap = envelopeTarget('savings', data.rules)
  const taxRate = data.rules.find((rule) => rule.is_active && rule.target_wallet === 'tax' && rule.rule_type === 'percentage_remainder')?.percentage ?? null
  const expectedTax = taxRate === null ? null : (total * taxRate) / 100
  const coverage = rent > 0 ? savings / rent : null

  const activeRulesCount = data.rules.filter((rule) => rule.is_active).length
  const rentScore = rent > 0 ? Math.min(1, rentBalance / rent) * 30 : 25
  const taxScore = expectedTax && expectedTax > 0 ? Math.min(1, tax / (expectedTax * 0.75)) * 30 : tax > 0 ? 25 : 15
  const savingsScore = cap && cap > 0 ? Math.min(1, savings / cap) * 25 : Math.min(1, savings / Math.max(1, rent || 5000)) * 25
  const rulesScore = (Math.min(4, activeRulesCount) / 4) * 15
  const healthScore = Math.max(0, Math.min(100, Math.round(rentScore + taxScore + savingsScore + rulesScore)))
  const healthStatus = healthScore >= 80 ? 'Strong reserve posture' : healthScore >= 55 ? 'Steady reserve progress' : 'Building reserves'
  const healthColor = healthScore >= 80 ? '#1baf7a' : healthScore >= 55 ? '#5d67ba' : '#eb6834'

  const processed = data.transactions.filter((item) =>
    item.status === 'processed' &&
    item.kind !== 'transfer' &&
    item.kind !== 'spending' &&
    !Object.values(item.allocations ?? {}).some((value) => typeof value === 'number' && value < 0),
  )
  const payments = processed.filter((item) =>
    item.created_at &&
    item.created_at.slice(0, 10) >= filters.start &&
    item.created_at.slice(0, 10) <= filters.end &&
    (!filters.envelope || (item.allocations?.[filters.envelope] ?? 0) > 0),
  )
  const detailed = processed.every((item) => Boolean(item.created_at) && (!filters.envelope || item.allocations?.[filters.envelope] !== undefined)) &&
    payments.length === summary.payments &&
    Math.abs(payments.reduce((sum, item) => sum + item.amount, 0) - total) < 0.02
  const detailMissing = 'Dated payment details are needed for this chart. Your period totals and envelope charts are available above.'
  const deviation = detailed && payments.length
    ? Math.sqrt(payments.reduce((sum, item) => sum + (item.amount - average) ** 2, 0) / payments.length)
    : 0
  const incomeMax = Math.max(1, ...payments.map((item) => item.amount))
  const minimum = payments.length ? Math.min(...payments.map((item) => item.amount)) : 0
  const binWidth = Math.max(1, incomeMax - minimum) / 5
  const histogram: HistogramBin[] = Array.from({ length: 5 }, (_, index) => ({
    lower: minimum + binWidth * index,
    upper: minimum + binWidth * (index + 1),
    count: payments.filter((item) =>
      item.amount >= minimum + binWidth * index &&
      (index === 4 ? item.amount <= minimum + binWidth * (index + 1) : item.amount < minimum + binWidth * (index + 1)),
    ).length,
  }))
  const maxCount = Math.max(1, ...histogram.map((bin) => bin.count))

  const suggestions: Suggestion[] = [
    {
      id: 'tax',
      title: 'Compare your Tax reserve',
      text: expectedTax !== null
        ? `${money.format(tax)} MAD is reserved. ${taxRate}% of the selected income would be ${money.format(expectedTax)} MAD. This is a comparison, not a tax bill.`
        : 'Add a Tax rule to compare your reserve with a percentage of income.',
      question: 'Explain my Tax reserve compared with my current Tax rule and payments.',
    },
    {
      id: 'cap',
      title: cap ? `${money.format(Math.max(0, cap - savings))} MAD to your Savings cap` : 'Give your Savings a target',
      text: cap
        ? `${money.format(savings)} of ${money.format(cap)} MAD is saved. Check the cap before your next payment.`
        : 'A Savings cap helps you see how close you are to your target.',
      question: 'Explain how my Savings cap works and what happens when it is reached.',
    },
    {
      id: 'rent',
      title: coverage !== null ? `Savings covers ${coverage.toFixed(1)} rent payments` : 'See how much rent Savings covers',
      text: rent > 0
        ? `At your current Rent rule of ${money.format(rent)} MAD, Savings covers ${coverage!.toFixed(1)} payments. This does not include other living costs.`
        : 'A fixed Rent rule is needed for this comparison.',
      question: 'Explain how my current Savings compares with my Rent rule.',
    },
    {
      id: 'largest',
      title: `${money.format(summary.largest_payment)} MAD largest payment`,
      text: `Your largest processed payment in the selected period. The average across ${summary.payments} payments is ${money.format(average)} MAD.`,
      question: 'Explain how larger payments affect my envelope allocations.',
    },
  ]

  return {
    types,
    total,
    average,
    largestPayment: summary.largest_payment,
    paymentCount: summary.payments,
    allocations,
    allocationTotal,
    missing,
    points,
    cumulative,
    maxAllocation,
    rentBalance,
    tax,
    savings,
    rent,
    cap,
    taxRate,
    expectedTax,
    coverage,
    healthScore,
    healthStatus,
    healthColor,
    payments,
    detailed,
    detailMissing,
    deviation,
    incomeMax,
    minimum,
    histogram,
    maxCount,
    suggestions,
  }
}
