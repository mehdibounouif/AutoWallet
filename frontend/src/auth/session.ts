import { useSyncExternalStore } from 'react'

const tokenKey = 'autowallet_token'
const sessionEvent = 'autowallet:session'
let endReason: 'signed-out' | 'expired' = 'signed-out'

export function getSessionEndReason() { return endReason }

export function readAccessToken(): string | null {
  try { return localStorage.getItem(tokenKey) || null } catch { return null }
}

export function saveAccessToken(token: string) {
  if (!token.trim()) throw new Error('Missing access token')
  localStorage.setItem(tokenKey, token)
  endReason = 'signed-out'
  window.dispatchEvent(new Event(sessionEvent))
}

export function clearAccessToken(reason: 'signed-out' | 'expired' = 'signed-out') {
  localStorage.removeItem(tokenKey)
  endReason = reason
  window.dispatchEvent(new Event(sessionEvent))
}

function subscribe(onChange: () => void) {
  const storageChanged = (event: StorageEvent) => {
    if (event.storageArea === localStorage && (event.key === tokenKey || event.key === null)) {
      endReason = 'signed-out'
      onChange()
    }
  }
  window.addEventListener('storage', storageChanged)
  window.addEventListener(sessionEvent, onChange)
  return () => {
    window.removeEventListener('storage', storageChanged)
    window.removeEventListener(sessionEvent, onChange)
  }
}

export function useAccessToken() {
  return useSyncExternalStore(subscribe, readAccessToken, () => null)
}
