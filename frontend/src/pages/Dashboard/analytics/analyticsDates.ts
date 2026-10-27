import type { AnalyticsInterval } from '../../../api/analyticsApi'

export const dateLabel = (value: string) =>
  new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' })
    .format(new Date(`${value}T12:00:00Z`))

export function periodStart(period: string, today: string) {
  const date = new Date(`${today}T00:00:00Z`)
  if (period === '30') date.setUTCDate(date.getUTCDate() - 29)
  else {
    date.setUTCDate(1)
    date.setUTCMonth(date.getUTCMonth() - Number(period) + 1)
  }
  return date.toISOString().slice(0, 10)
}

export function pointLabel(period: string, interval: AnalyticsInterval) {
  if (interval === 'week') return period.replace(/^(\d{4})-W(\d{2})$/, 'W$2 $1')
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    ...(interval === 'day' ? { day: 'numeric' as const } : { year: '2-digit' as const }),
    timeZone: 'UTC',
  }).format(new Date(`${period}${interval === 'month' ? '-01' : ''}T12:00:00Z`))
}
