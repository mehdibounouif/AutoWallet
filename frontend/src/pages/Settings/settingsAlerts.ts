import { useSyncExternalStore } from 'react'

const changeEvent = 'autowallet:alerts'
const fallbackAlerts = new Map<string, boolean>()

function subscribe(onChange: () => void) {
  window.addEventListener('storage', onChange)
  window.addEventListener(changeEvent, onChange)
  return () => {
    window.removeEventListener('storage', onChange)
    window.removeEventListener(changeEvent, onChange)
  }
}

export function getPaymentAlerts(userId: string) {
  if (fallbackAlerts.has(userId)) return fallbackAlerts.get(userId)!
  try {
    return localStorage.getItem(`autowallet_payment_alerts:${userId}`) !== 'off'
  } catch {
    return fallbackAlerts.get(userId) ?? true
  }
}

export function usePaymentAlerts(userId: string) {
  return useSyncExternalStore(subscribe, () => getPaymentAlerts(userId), () => true)
}

export function savePaymentAlerts(userId: string, enabled: boolean) {
  let persisted = true
  try {
    localStorage.setItem(`autowallet_payment_alerts:${userId}`, enabled ? 'on' : 'off')
    fallbackAlerts.delete(userId)
  } catch {
    persisted = false
    fallbackAlerts.set(userId, enabled)
  }
  window.dispatchEvent(new Event(changeEvent))
  return persisted
}
