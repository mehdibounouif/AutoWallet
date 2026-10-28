export const money = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

export function formatCompactMoney(value: number): string {
  if (!Number.isFinite(value) || value <= 0) return '0.00'
  if (value >= 1_000_000_000) {
    return `${(value / 1_000_000_000).toLocaleString('en-US', { maximumFractionDigits: 2 })}B`
  }
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toLocaleString('en-US', { maximumFractionDigits: 2 })}M`
  }
  if (value >= 100_000) {
    return `${(value / 1_000).toLocaleString('en-US', { maximumFractionDigits: 1 })}k`
  }
  return money.format(value)
}

const shortDate = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' })
const fullDate = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

export function formatDate(value?: string, includeYear = false) {
  if (!value) return ''
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '' : (includeYear ? fullDate : shortDate).format(date)
}

export function parseAmount(value: string) {
  const trimmed = value.trim()
  if (!/^(?:\d+|\d{1,3}(?:,\d{3})+|\d{1,3}(?:[ \u00a0\u202f]\d{3})+)(?:\.\d{1,2})?$/.test(trimmed)) return NaN
  return Number(trimmed.replace(/[, \u00a0\u202f]/g, ''))
}

export function isValidRuleValue(value: string, maximum = Infinity) {
  const amount = parseAmount(value)
  return Number.isFinite(amount) && amount >= 0 && amount <= maximum
}
