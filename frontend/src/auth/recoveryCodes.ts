export const normalizeRecoveryCode = (value: string) => value.trim().toUpperCase()
export const isRecoveryCode = (value: string) => /^[A-F0-9]{32}$/.test(normalizeRecoveryCode(value))

const sessionRecoveryCodes = new Map<string, string[]>()

function recoveryCodesKey(email: string): string {
  return `autowallet_recovery_codes_${email.trim().toLowerCase()}`
}

function twoFactorStatusKey(email: string): string {
  return `autowallet_2fa_${email.trim().toLowerCase()}`
}

export function getTwoFactorStatus(email: string): boolean | null {
  try {
    const val = localStorage.getItem(twoFactorStatusKey(email))
    if (val === 'true') return true
    if (val === 'false') return false
  } catch {
    // ignore
  }
  return null
}

export function setTwoFactorStatus(email: string, enabled: boolean): void {
  try {
    localStorage.setItem(twoFactorStatusKey(email), enabled ? 'true' : 'false')
  } catch {
    // ignore
  }
}

export function getRecoveryCodes(email: string): string[] {
  const inMemory = sessionRecoveryCodes.get(email.trim().toLowerCase())
  if (inMemory && inMemory.length > 0) return inMemory
  try {
    const raw = sessionStorage.getItem(recoveryCodesKey(email))
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed) && parsed.length > 0) return parsed as string[]
    }
  } catch {
    // ignore
  }
  return []
}

export function setRecoveryCodes(email: string, codes: string[]): void {
  sessionRecoveryCodes.set(email.trim().toLowerCase(), [...codes])
  try {
    sessionStorage.setItem(recoveryCodesKey(email), JSON.stringify(codes))
  } catch {
    // ignore
  }
}

export function clearRecoveryCodes(email?: string): void {
  if (email) {
    sessionRecoveryCodes.delete(email.trim().toLowerCase())
    try {
      sessionStorage.removeItem(recoveryCodesKey(email))
    } catch {
      // ignore
    }
  } else {
    sessionRecoveryCodes.clear()
    try {
      const toRemove: string[] = []
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i)
        if (key?.startsWith('autowallet_recovery_codes_')) {
          toRemove.push(key)
        }
      }
      toRemove.forEach((k) => sessionStorage.removeItem(k))
    } catch {
      // ignore
    }
  }
}

export function parseRecoveryCodes(payload: unknown): string[] {
  if (!payload || typeof payload !== 'object' || !('recovery_codes' in payload) ||
      !Array.isArray(payload.recovery_codes) || payload.recovery_codes.length === 0 ||
      !payload.recovery_codes.every((code: unknown) => typeof code === 'string' && isRecoveryCode(code))) {
    throw new Error('Recovery codes could not be read. Generate a new set before relying on backup sign-in.')
  }
  const codes = payload.recovery_codes.map(normalizeRecoveryCode)
  if (new Set(codes).size !== codes.length) throw new Error('The service returned duplicate recovery codes. Generate a new set.')
  return codes
}
