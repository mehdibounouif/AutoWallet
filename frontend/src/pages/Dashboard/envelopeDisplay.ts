import type { ComponentType } from 'react'
import { House, Landmark, PiggyBank, ShoppingBag, Wallet } from 'lucide-react'
import type { DashboardRule, WalletType } from './dashboardApi'
import { money } from '../../utils/format'
import { translations } from '../../i18n'
export { money } from '../../utils/format'

export const envelopeOrder: WalletType[] = ['rent', 'tax', 'savings', 'main']
export const walletOrder: WalletType[] = ['rent', 'tax', 'savings', 'free', 'main']

export const envelopeMeta: Record<WalletType, {
  readonly name: string
  icon: ComponentType<{ className?: string }>
  color: string
  tint: string
}> = {
  rent: { get name() { return translations.envNameRent || 'Rent' }, icon: House, color: '#2A78D6', tint: '#EAF2FC' },
  tax: { get name() { return translations.envNameTax || 'Tax' }, icon: Landmark, color: '#EB6834', tint: '#FDEEE8' },
  savings: { get name() { return translations.envNameSavings || 'Savings' }, icon: PiggyBank, color: '#1BAF7A', tint: '#E3F5EE' },
  free: { get name() { return translations.envNameFree || 'Free to spend' }, icon: ShoppingBag, color: '#A57400', tint: '#FBF1D7' },
  main: { get name() { return translations.envNameMain || 'Main' }, icon: Wallet, color: '#526176', tint: '#E9EDF2' },
}

export const envelopeChartColor = (type: WalletType) => type === 'free' ? '#EDA100' : type === 'main' ? '#8A95D2' : envelopeMeta[type].color

export function envelopeTarget(type: WalletType, rules: DashboardRule[]) {
  return rules.find((rule) => rule.is_active && rule.target_wallet === type &&
    rule.condition_field === `${type}_balance` && (rule.condition_operator === '<' || rule.condition_operator === '<=') &&
    rule.condition_value !== null && rule.condition_value > 0)?.condition_value ?? null
}

function comparisonLabel(operator: string | null) {
  switch (operator) {
    case '<': return translations.compareBelow
    case '<=': return translations.compareAtOrBelow
    case '>': return translations.compareAbove
    case '>=': return translations.compareAtOrAbove
    case '==': return translations.compareEqualTo
    default: return null
  }
}

export function ruleDescription(rule: DashboardRule) {
  const target = envelopeMeta[rule.target_wallet].name
  const allocation = rule.rule_type === 'lock_fixed'
    ? translations.ruleLockInto
      .replace('{amount}', money.format(rule.fixed_amount ?? 0))
      .replace('{target}', target)
    : translations.rulePercentInto
      .replace('{percent}', String(rule.percentage ?? 0))
      .replace('{target}', target)

  if (rule.condition_field === null) return allocation
  const conditionWallet = walletOrder.find((type) => rule.condition_field === `${type}_balance`)
  const comparison = comparisonLabel(rule.condition_operator)
  return conditionWallet && rule.condition_value !== null && comparison
    ? translations.ruleConditionWhile
      .replace('{allocation}', allocation)
      .replace('{wallet}', envelopeMeta[conditionWallet].name)
      .replace('{comparison}', comparison)
      .replace('{amount}', money.format(rule.condition_value))
    : translations.ruleConditionSaved.replace('{allocation}', allocation)
}

export function envelopeDescription(type: WalletType, rules: DashboardRule[]): string {
  const rule = rules.find((item) => item.is_active && item.target_wallet === type)
  if (!rule) return type === 'main' ? translations.envelopeMainNoRule : translations.envelopeNoRule

  if (rule.condition_field !== null &&
      (rule.condition_field !== `${type}_balance` || rule.condition_operator !== '<' || rule.condition_value === null)) {
    return ruleDescription(rule)
  }

  const previous = rules.filter((item) => item.is_active && item.priority < rule.priority).at(-1)
  const after = previous ? translations.afterRule.replace('{name}', envelopeMeta[previous.target_wallet].name) : ''

  if (rule.rule_type === 'lock_fixed' && rule.fixed_amount !== null) {
    return rule.condition_field === `${type}_balance` && rule.condition_value !== null
      ? translations.ruleFixedBelow
        .replace('{amount}', money.format(rule.fixed_amount))
        .replace('{cap}', money.format(rule.condition_value))
      : translations.ruleFixedFirst.replace('{amount}', money.format(rule.fixed_amount))
  }

  if (rule.rule_type === 'percentage_remainder' && rule.percentage !== null) {
    if (rule.condition_field === `${type}_balance` && rule.condition_value !== null) {
      return translations.rulePercentUntil
        .replace('{percent}', String(rule.percentage))
        .replace('{cap}', money.format(rule.condition_value))
    }
    const template = rule.percentage === 100 ? translations.ruleEverythingLeft : translations.rulePercentLeft
    return template
      .replace('{percent}', String(rule.percentage))
      .replace('{after}', after)
  }

  return translations.ruleDetailsUnavailable
}
