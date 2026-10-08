import type { Interval } from './api'

const money = new Intl.NumberFormat('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const compactNumber = new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 })
const shortDay = new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' })
const longDay = new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' })
const monthYear = new Intl.DateTimeFormat('en', { month: 'short', year: 'numeric' })

/** 3500 → "3,500.00 MAD" */
export function formatMAD(value: number): string {
  return `${money.format(value)} MAD`
}

/** 12500 → "12.5K" (chart axes) */
export function formatCompact(value: number): string {
  return compactNumber.format(value)
}

/** "2026-10-08" → a Date at local midnight (new Date("2026-10-08") would be UTC midnight). */
function parseDay(iso: string): Date {
  const [year, month, day] = iso.split('-').map(Number)
  return new Date(year, month - 1, day)
}

/** A Date → "2026-10-08", in the user's time zone. */
export function toISODay(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${month}-${day}`
}

export function addDays(iso: string, days: number): string {
  const date = parseDay(iso)
  date.setDate(date.getDate() + days)
  return toISODay(date)
}

/** How many days from start to end, both included. */
export function daysInRange(start: string, end: string): number {
  return Math.round((parseDay(end).getTime() - parseDay(start).getTime()) / 86_400_000) + 1
}

/** "2026-10-08" → "Oct 8, 2026" */
export function formatDay(iso: string): string {
  return longDay.format(parseDay(iso))
}

/** The label of a chart point: "Oct 8", "Week 41" or "Oct 2026". */
export function formatPeriod(period: string, interval: Interval): string {
  if (interval === 'day') return shortDay.format(parseDay(period))
  if (interval === 'week') return `Week ${Number(period.split('-W')[1])}`
  return monthYear.format(parseDay(`${period}-01`))
}
