import { useState } from 'react'
import type { DashboardTransaction } from './dashboardApi'

function readIds(userId: string): string[] {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(`autowallet_notification_reads:${userId}`) || '[]')
    return Array.isArray(value) ? value.filter((id): id is string => typeof id === 'string') : []
  } catch { return [] }
}

// The service has no notification API yet; read state belongs to this browser.
export function usePaymentNotifications(userId: string, payments: DashboardTransaction[]) {
  const [read, setRead] = useState<{ userId: string; ids: string[] }>(() => ({ userId, ids: userId ? readIds(userId) : [] }))
  const ids = read.userId === userId ? read.ids : readIds(userId)
  const unread = payments.filter(payment => !ids.includes(payment.id)).length
  const markRead = (nextIds: string[]) => {
    const next = [...new Set([...ids, ...nextIds])]
    setRead({ userId, ids: next })
    try { localStorage.setItem(`autowallet_notification_reads:${userId}`, JSON.stringify(next)) } catch { /* Read state still works for this visit. */ }
  }
  return { unread, readIds: ids, markRead }
}
