import type { EnvelopeId } from './envelopes'

// The answers of /api/analytics (backend/app/analytics/schemas.py).

export type Interval = 'day' | 'week' | 'month'
export type EnvelopeAmounts = Partial<Record<EnvelopeId, number>>

export interface Summary {
  start: string
  end: string
  envelope: EnvelopeId | null
  payments: number
  received: number
  average_payment: number
  largest_payment: number
  by_envelope: EnvelopeAmounts
  balances: EnvelopeAmounts
}

export interface TimeseriesPoint {
  period: string
  received: number
  envelopes: EnvelopeAmounts
}

export interface Timeseries {
  start: string
  end: string
  interval: Interval
  envelope: EnvelopeId | null
  points: TimeseriesPoint[]
}

/** What /api/analytics/live sends when one of the user's payments is processed. */
export interface PaymentEvent {
  reference: string
  amount: number
  allocations: EnvelopeAmounts
}

export interface Filters {
  start: string
  end: string
  envelope: EnvelopeId | ''
}

/** The filters as a query string: start=…&end=…(&envelope=…) */
export function filtersQuery({ start, end, envelope }: Filters): string {
  const params = new URLSearchParams({ start, end })
  if (envelope) params.set('envelope', envelope)
  return params.toString()
}
