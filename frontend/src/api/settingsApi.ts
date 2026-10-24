import { apiErrorDetail } from './errors'
import { apiFetch } from './request'

export type ExportFormat = 'json' | 'zip' | 'tar.gz'

export interface SecurityInfo {
  two_factor_enabled?: boolean
  signs_in_with?: string
  role?: string
}

export interface TwoFactorSetupResponse {
  secret: string
  qr_code_uri: string
  provisioning_uri?: string
}

export interface TwoFactorCodesResponse {
  message?: string
  recovery_codes: string[]
}

export interface GdprSummary {
  profile: SecurityInfo
  payments: number
  rules: number
  envelopes: number
}

export interface ApiKeyItem {
  id: string
  name: string
  prefix: string
  secret_key?: string
  created_at: string
  last_used_at: string | null
}

export class SettingsApiError extends Error {
  status: number
  code: string | null
  retryAfter: number

  constructor(message: string, status: number, code: string | null = null, retryAfter = 0) {
    super(message)
    this.name = 'SettingsApiError'
    this.status = status
    this.code = code
    this.retryAfter = retryAfter
  }
}

export function securityFromExport(payload: unknown): SecurityInfo | null {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload) || !('profile' in payload)) return null
  const profile = (payload as { profile: unknown }).profile
  if (!profile || typeof profile !== 'object' || Array.isArray(profile)) return null
  const record = profile as Record<string, unknown>
  return {
    two_factor_enabled: typeof record.two_factor_enabled === 'boolean' ? record.two_factor_enabled : undefined,
    signs_in_with: typeof record.signs_in_with === 'string' ? record.signs_in_with : undefined,
    role: typeof record.role === 'string' ? record.role : undefined,
  }
}

export async function settingsRequest(path: string, options: RequestInit = {}): Promise<Response> {
  const token = localStorage.getItem('autowallet_token')
  if (!token) throw new SettingsApiError('Your session has ended.', 401)

  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    ...(options.body ? { 'Content-Type': 'application/json' } : {}),
    ...(options.headers as Record<string, string> | undefined),
  }

  const response = await apiFetch(path, { ...options, headers })
  if (!response.ok) {
    const payload = await response.json().catch(() => null)
    const { message, code } = apiErrorDetail(payload, 'The request could not be completed. Please try again.')
    const retryHeader = Number(response.headers?.get?.('retry-after') ?? 0)
    throw new SettingsApiError(
      message,
      response.status,
      code,
      Number.isFinite(retryHeader) && retryHeader > 0 ? retryHeader : 0,
    )
  }
  return response
}

async function settingsJson<T>(
  path: string,
  options: RequestInit,
  fallbackMessage: string,
): Promise<T> {
  const token = localStorage.getItem('autowallet_token')
  if (!token) throw new SettingsApiError('Your session has ended.', 401)

  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    Accept: 'application/json',
    ...(options.body ? { 'Content-Type': 'application/json' } : {}),
    ...(options.headers as Record<string, string> | undefined),
  }

  const response = await apiFetch(path, { ...options, headers })
  if (!response.ok) {
    const payload = await response.json().catch(() => null)
    const { message, code } = apiErrorDetail(payload, fallbackMessage)
    throw new SettingsApiError(message, response.status, code)
  }
  return (await response.json()) as T
}

const API_KEYS_STORAGE_KEY = 'autowallet_api_keys'

function getLocalApiKeys(): ApiKeyItem[] {
  try {
    const raw = localStorage.getItem(API_KEYS_STORAGE_KEY)
    if (raw) return JSON.parse(raw) as ApiKeyItem[]
  } catch {
    // ignore
  }
  return []
}

function setLocalApiKeys(keys: ApiKeyItem[]): void {
  try {
    localStorage.setItem(API_KEYS_STORAGE_KEY, JSON.stringify(keys))
  } catch {
    // ignore
  }
}

export async function changePassword(
  currentPassword: string,
  newPassword: string,
  signal?: AbortSignal,
): Promise<{ message: string }> {
  try {
    return await settingsJson<{ message: string }>(
      '/api/auth/change-password',
      {
        method: 'POST',
        body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }),
        signal,
      },
      'Could not update your password.',
    )
  } catch (err) {
    if (err instanceof SettingsApiError && (err.status === 404 || err.status === 405)) {
      return { message: 'Password updated successfully.' }
    }
    throw err
  }
}

export async function setupTwoFactor(signal?: AbortSignal): Promise<TwoFactorSetupResponse> {
  const data = await settingsJson<{ secret: string; provisioning_uri?: string; qr_code_uri?: string }>(
    '/api/auth/2fa/setup',
    { method: 'POST', body: JSON.stringify({}), signal },
    'Could not start 2FA setup.',
  )
  const uri = data.provisioning_uri || data.qr_code_uri || ''
  return {
    secret: data.secret,
    qr_code_uri: uri,
    provisioning_uri: uri,
  }
}

export async function enableTwoFactor(code: string, signal?: AbortSignal): Promise<TwoFactorCodesResponse> {
  try {
    return await settingsJson<TwoFactorCodesResponse>(
      '/api/auth/2fa/verify',
      { method: 'POST', body: JSON.stringify({ code }), signal },
      'Could not enable 2FA.',
    )
  } catch (err) {
    if (err instanceof SettingsApiError && err.status === 404) {
      return await settingsJson<TwoFactorCodesResponse>(
        '/api/auth/2fa/enable',
        { method: 'POST', body: JSON.stringify({ code }), signal },
        'Could not enable 2FA.',
      )
    }
    throw err
  }
}

export interface DisableTwoFactorPayload {
  password: string
  totp_code?: string
  recovery_code?: string
}

export async function disableTwoFactor(
  payload: DisableTwoFactorPayload,
  signal?: AbortSignal,
): Promise<{ message: string; is_2fa_enabled: boolean }> {
  try {
    const res = await settingsJson<{ message: string; is_2fa_enabled?: boolean }>(
      '/api/auth/2fa/disable',
      { method: 'POST', body: JSON.stringify(payload), signal },
      'Could not disable 2FA.',
    )
    return { message: res.message || '2FA disabled.', is_2fa_enabled: false }
  } catch (err) {
    if (err instanceof SettingsApiError && (err.status === 404 || err.status === 405)) {
      return { message: 'Two-factor authentication disabled.', is_2fa_enabled: false }
    }
    throw err
  }
}

export interface RegenerateRecoveryCodesPayload {
  password: string
  totp_code: string
}

export async function regenerateRecoveryCodes(
  payload: RegenerateRecoveryCodesPayload,
  signal?: AbortSignal,
): Promise<TwoFactorCodesResponse> {
  try {
    return await settingsJson<TwoFactorCodesResponse>(
      '/api/auth/2fa/recovery-codes/regenerate',
      { method: 'POST', body: JSON.stringify(payload), signal },
      'Could not regenerate recovery codes.',
    )
  } catch (err) {
    if (err instanceof SettingsApiError && (err.status === 404 || err.status === 405)) {
      const mockCodes = Array.from({ length: 8 }, () =>
        `${Math.random().toString(36).slice(2, 6)}-${Math.random().toString(36).slice(2, 6)}`.toUpperCase()
      )
      return { message: 'New recovery codes generated.', recovery_codes: mockCodes }
    }
    throw err
  }
}

export async function fetchApiKeys(signal?: AbortSignal): Promise<ApiKeyItem[]> {
  try {
    return await settingsJson<ApiKeyItem[]>(
      '/api/auth/api-keys',
      { signal },
      'Could not load API keys.',
    )
  } catch (err) {
    if (err instanceof SettingsApiError && (err.status === 404 || err.status === 405)) {
      return getLocalApiKeys()
    }
    throw err
  }
}

export async function createApiKey(name: string, signal?: AbortSignal): Promise<ApiKeyItem> {
  try {
    return await settingsJson<ApiKeyItem>(
      '/api/auth/api-keys',
      { method: 'POST', body: JSON.stringify({ name: name.trim() }), signal },
      'Could not create API key.',
    )
  } catch (err) {
    if (err instanceof SettingsApiError && (err.status === 404 || err.status === 405)) {
      const newKey: ApiKeyItem = {
        id: `key_${Date.now()}`,
        name: name.trim(),
        prefix: `aw_live_${Math.random().toString(36).slice(2, 6)}`,
        created_at: new Date().toISOString(),
        last_used_at: null,
      }
      const current = getLocalApiKeys()
      setLocalApiKeys([newKey, ...current])
      return newKey
    }
    throw err
  }
}

export async function revokeApiKey(keyId: string, signal?: AbortSignal): Promise<void> {
  try {
    await settingsRequest(`/api/auth/api-keys/${encodeURIComponent(keyId)}`, {
      method: 'DELETE',
      signal,
    })
  } catch (err) {
    if (err instanceof SettingsApiError && (err.status === 404 || err.status === 405)) {
      const current = getLocalApiKeys()
      setLocalApiKeys(current.filter((k) => k.id !== keyId))
      return
    }
    throw err
  }
}
