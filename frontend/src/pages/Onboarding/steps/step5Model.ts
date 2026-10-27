import { Home, Landmark, PiggyBank, ShoppingBag } from 'lucide-react'
import type { ComponentType } from 'react'
import type { Translations } from '../../../i18n'
import type { DashboardRule } from '../../Dashboard/dashboardApi'
import { previewPayment } from '../../Dashboard/dashboardSplit'
import { walletTypes } from '../../../api/walletTypes'
import { parseAmount } from '../../../utils/format'

export interface Allocation {
  name: string
  amount: number
  remaining: number
  rule: string
  color: string
  Icon: ComponentType<{ className?: string }>
}

/** Build the starter-rule allocation preview using the shared split engine. */
export function getAllocations(amount: number, rentAmount: string, taxPercent: string, savingsPercent: string, savingsCap: string, t: Translations): Allocation[] {
  // Match the backend starter rules and reuse the Dashboard/Sandbox engine.
  // Keep fractional cents during allocation; format to two decimals for display.
  const base = { is_active: true, fixed_amount: null, percentage: null, condition_field: null, condition_operator: null, condition_value: null }
  const rules: DashboardRule[] = [
    { ...base, id: 'rent', name: 'Rent lock', rule_type: 'lock_fixed', target_wallet: 'rent', priority: 1, fixed_amount: parseAmount(rentAmount), condition_field: 'rent_balance', condition_operator: '<', condition_value: parseAmount(rentAmount) },
    { ...base, id: 'tax', name: 'Tax', rule_type: 'percentage_remainder', target_wallet: 'tax', priority: 2, percentage: parseAmount(taxPercent) },
    { ...base, id: 'savings', name: 'Savings (capped)', rule_type: 'percentage_remainder', target_wallet: 'savings', priority: 3, percentage: parseAmount(savingsPercent), condition_field: 'savings_balance', condition_operator: '<', condition_value: parseAmount(savingsCap) },
    { ...base, id: 'free', name: 'Free to spend', rule_type: 'percentage_remainder', target_wallet: 'free', priority: 4, percentage: 100 },
  ]
  const { allocations: { rent, tax, savings, free }, steps } = previewPayment(
    amount,
    rules,
    walletTypes.map((walletType) => ({ id: walletType, wallet_type: walletType, balance: 0 })),
  )
  const afterRent = steps[0]?.remaining ?? amount
  const afterTax = steps[1]?.remaining ?? afterRent

  return [
    { name: t.rentName, amount: rent, remaining: afterRent, rule: t.fixedAmountType, color: '#2a78d6', Icon: Home },
    { name: t.taxName, amount: tax, remaining: afterTax, rule: `${parseAmount(taxPercent)}% ${t.percentOfLeftType}`, color: '#eb6834', Icon: Landmark },
    { name: t.savingsName, amount: savings, remaining: free, rule: `${parseAmount(savingsPercent)}% ${t.percentOfLeftType}`, color: '#1baf7a', Icon: PiggyBank },
    { name: t.freeToSpendName, amount: free, remaining: 0, rule: `100% ${t.percentOfLeftType}`, color: '#eda100', Icon: ShoppingBag },
  ]
}
