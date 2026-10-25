import type { ComponentType } from 'react'
import { House, Landmark, PiggyBank, ShoppingBag, Wallet } from 'lucide-react'
import type { DashboardRule, WalletType } from './dashboardApi'
import { money } from '../../utils/format'
import { ruleComparisonLabel } from './dashboardSplit'
import { getLanguage, translations } from '../../i18n'
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

export function ruleDescription(rule: DashboardRule) {
  const lang = getLanguage()
  const target = envelopeMeta[rule.target_wallet].name

  if (lang === 'fr') {
    const allocation = rule.rule_type === 'lock_fixed'
      ? `Bloquer ${money.format(rule.fixed_amount ?? 0)} MAD dans ${target}`
      : `Placer ${rule.percentage ?? 0} % du reste dans ${target}`
    if (rule.condition_field === null) return allocation
    const conditionWallet = walletOrder.find(type => rule.condition_field === `${type}_balance`)
    const comparison = ruleComparisonLabel(rule.condition_operator)
    return conditionWallet && rule.condition_value !== null && comparison
      ? `${allocation}, seulement tant que ${envelopeMeta[conditionWallet].name} est ${comparison} ${money.format(rule.condition_value)}`
      : `${allocation}, seulement si sa condition est remplie`
  }

  if (lang === 'ar') {
    const allocation = rule.rule_type === 'lock_fixed'
      ? `حجز ${money.format(rule.fixed_amount ?? 0)} درهم في ${target}`
      : `وضع ${rule.percentage ?? 0}% مما تبقى في ${target}`
    if (rule.condition_field === null) return allocation
    const conditionWallet = walletOrder.find(type => rule.condition_field === `${type}_balance`)
    const comparison = ruleComparisonLabel(rule.condition_operator)
    return conditionWallet && rule.condition_value !== null && comparison
      ? `${allocation}، فقط طالما أن ${envelopeMeta[conditionWallet].name} ${comparison} ${money.format(rule.condition_value)}`
      : `${allocation}، فقط عند تحقق الشرط المحفوظ`
  }

  const allocation = rule.rule_type === 'lock_fixed'
    ? `Lock ${money.format(rule.fixed_amount ?? 0)} MAD into ${target}`
    : `Put ${rule.percentage ?? 0}% of what's left into ${target}`
  if (rule.condition_field === null) return allocation
  const conditionWallet = walletOrder.find(type => rule.condition_field === `${type}_balance`)
  const comparison = ruleComparisonLabel(rule.condition_operator)
  return conditionWallet && rule.condition_value !== null && comparison
    ? `${allocation}, only while ${envelopeMeta[conditionWallet].name} is ${comparison} ${money.format(rule.condition_value)}`
    : `${allocation}, only when its saved condition is met`
}

export function envelopeDescription(type: WalletType, rules: DashboardRule[]): string {
  const lang = getLanguage()
  const rule = rules.find((item) => item.is_active && item.target_wallet === type)
  if (!rule) {
    if (lang === 'fr') return type === 'main' ? 'Tout ce que les règles ne prennent pas' : 'Aucune règle active'
    if (lang === 'ar') return type === 'main' ? 'أي شيء لا تأخذه القواعد' : 'لا توجد قاعدة نشطة'
    return type === 'main' ? "Anything the rules don't take" : 'No active rule'
  }

  if (rule.condition_field !== null &&
      (rule.condition_field !== `${type}_balance` || rule.condition_operator !== '<' || rule.condition_value === null)) {
    return ruleDescription(rule)
  }
  const previous = rules.filter((item) => item.is_active && item.priority < rule.priority).at(-1)
  const prevName = previous ? envelopeMeta[previous.target_wallet].name : ''
  const after = previous ? (lang === 'fr' ? ` après ${prevName}` : lang === 'ar' ? ` بعد ${prevName}` : ` after ${prevName}`) : ''

  if (rule.rule_type === 'lock_fixed' && rule.fixed_amount !== null) {
    if (lang === 'fr') {
      return rule.condition_field === `${type}_balance` && rule.condition_value !== null
        ? `Reçoit ${money.format(rule.fixed_amount)} en premier dès qu’il est inférieur à ${money.format(rule.condition_value)}`
        : `Reçoit ${money.format(rule.fixed_amount)} en premier`
    }
    if (lang === 'ar') {
      return rule.condition_field === `${type}_balance` && rule.condition_value !== null
        ? `يحصل على ${money.format(rule.fixed_amount)} أولاً كلما كان أقل من ${money.format(rule.condition_value)}`
        : `يحصل على ${money.format(rule.fixed_amount)} أولاً`
    }
    return rule.condition_field === `${type}_balance` && rule.condition_value !== null
      ? `Gets ${money.format(rule.fixed_amount)} first whenever it's below ${money.format(rule.condition_value)}`
      : `Gets ${money.format(rule.fixed_amount)} first`
  }

  if (rule.rule_type === 'percentage_remainder' && rule.percentage !== null) {
    if (lang === 'fr') {
      if (rule.condition_field === `${type}_balance` && rule.condition_value !== null) {
        return `${rule.percentage} % du reste, jusqu’à ${money.format(rule.condition_value)}`
      }
      return rule.percentage === 100 ? `Tout ce qui reste${after}` : `${rule.percentage} % du reste${after}`
    }
    if (lang === 'ar') {
      if (rule.condition_field === `${type}_balance` && rule.condition_value !== null) {
        return `${rule.percentage}% مما تبقى، حتى ${money.format(rule.condition_value)}`
      }
      return rule.percentage === 100 ? `كل ما تبقى${after}` : `${rule.percentage}% مما تبقى${after}`
    }
    if (rule.condition_field === `${type}_balance` && rule.condition_value !== null) {
      return `${rule.percentage}% of what's left, until ${money.format(rule.condition_value)}`
    }
    return rule.percentage === 100 ? `Everything left${after}` : `${rule.percentage}% of what's left${after}`
  }

  return lang === 'fr' ? 'Détails de la règle indisponibles' : lang === 'ar' ? 'تفاصيل القاعدة غير متوفرة' : 'Rule details unavailable'
}
