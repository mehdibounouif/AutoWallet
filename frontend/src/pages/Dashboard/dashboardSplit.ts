import type { DashboardRule, DashboardWallet, WalletType } from './dashboardApi'

export type SplitAmounts = Record<WalletType, number>

const walletTypes: WalletType[] = ['main', 'rent', 'tax', 'savings', 'free']

export function previewSplit(amount: number, rules: DashboardRule[], wallets: DashboardWallet[]): SplitAmounts {
  const allocations = Object.fromEntries(walletTypes.map((type) => [type, 0])) as SplitAmounts
  if (!Number.isFinite(amount) || amount <= 0) return allocations

  const balances = new Map(wallets.map((wallet) => [`${wallet.wallet_type}_balance`, wallet.balance]))
  let remaining = amount
  for (const rule of [...rules].filter((item) => item.is_active).sort((a, b) => a.priority - b.priority)) {
    if (remaining <= 0) break
    if (rule.condition_field !== null) {
      const balance = balances.get(rule.condition_field)
      const threshold = rule.condition_value
      if (balance === undefined || threshold === null) continue
      const matches = rule.condition_operator === '<' ? balance < threshold
        : rule.condition_operator === '<=' ? balance <= threshold
          : rule.condition_operator === '>' ? balance > threshold
            : rule.condition_operator === '>=' ? balance >= threshold
              : rule.condition_operator === '==' ? balance === threshold : false
      if (!matches) continue
    }

    let take = rule.rule_type === 'lock_fixed'
      ? Math.min(rule.fixed_amount ?? 0, remaining)
      : remaining * ((rule.percentage ?? 0) / 100)
    const ownBalanceField = `${rule.target_wallet}_balance`
    if (rule.rule_type === 'percentage_remainder' &&
        rule.condition_field === ownBalanceField &&
        (rule.condition_operator === '<' || rule.condition_operator === '<=') &&
        rule.condition_value !== null) {
      take = Math.min(take, Math.max(0, rule.condition_value - (balances.get(ownBalanceField) ?? 0)))
    }
    const safeTake = Math.max(0, Math.min(remaining, take))
    allocations[rule.target_wallet] += safeTake
    remaining -= safeTake
  }
  allocations.main += Math.max(0, remaining)
  return allocations
}
