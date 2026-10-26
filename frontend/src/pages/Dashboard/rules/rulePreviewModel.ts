import type { DashboardData, DashboardRule, WalletType } from '../dashboardApi'
import type { SplitAmounts } from '../dashboardSplit'
import { previewPayment } from '../dashboardSplit'
import { envelopeMeta } from '../envelopeDisplay'
import { money } from '../../../utils/format'

export const SAMPLE_AMOUNT = 10_000
export type RulePreviewNotes = Partial<Record<'rent' | 'tax' | 'savings' | 'free', string>>

export function buildRulePreview(data: DashboardData): { allocations: SplitAmounts; subtexts: RulePreviewNotes } {
  const balances = new Map<WalletType, number>(data.wallets.map((wallet) => [wallet.wallet_type, wallet.balance]))
  const preview = previewPayment(SAMPLE_AMOUNT, data.rules, data.wallets)
  const subtexts: RulePreviewNotes = {}
  const activeByWallet = new Map<WalletType, DashboardRule>()
  for (const rule of [...data.rules].filter((item) => item.is_active).sort((a, b) => a.priority - b.priority)) {
    if (!activeByWallet.has(rule.target_wallet)) activeByWallet.set(rule.target_wallet, rule)
  }

  for (const type of ['rent', 'tax', 'savings', 'free'] as const) {
    const rule = activeByWallet.get(type)
    const step = preview.steps.find((item) => item.rule.id === rule?.id)
    const balance = balances.get(type) ?? 0
    if (!rule) {
      subtexts[type] = 'No active rule'
    } else if (step?.reason !== null && rule.condition_field === `${type}_balance` && rule.condition_value !== null) {
      subtexts[type] = `${envelopeMeta[type].name} is at ${money.format(balance)}`
    } else if (step?.reason !== null) {
      subtexts[type] = 'Condition not met'
    } else if (rule.rule_type === 'lock_fixed') {
      subtexts[type] = 'Locked first'
    } else if (rule.percentage === 100) {
      subtexts[type] = '100% of remainder'
    } else if (rule.percentage !== null) {
      subtexts[type] = `${rule.percentage}% of ${money.format(step ? step.remaining + step.allocated : SAMPLE_AMOUNT)}`
    }
  }
  return { allocations: preview.allocations, subtexts }
}

export function previewExplanation(data: DashboardData, allocations: SplitAmounts) {
  const rentRule = data.rules.find((rule) => rule.is_active && rule.target_wallet === 'rent' && rule.condition_value !== null)
  const rentBalance = data.wallets.find((wallet) => wallet.wallet_type === 'rent')?.balance ?? 0
  if (rentRule && rentRule.condition_value !== null && rentBalance >= rentRule.condition_value && allocations.rent === 0) {
    return `Rent is already at ${money.format(rentBalance)}, so rule 1 is skipped and the full ${money.format(SAMPLE_AMOUNT)} flows to Tax, Savings, and Free to spend.`
  }
  return `Based on your current envelope balances, ${money.format(SAMPLE_AMOUNT)} MAD splits across your active rules in priority order.`
}
