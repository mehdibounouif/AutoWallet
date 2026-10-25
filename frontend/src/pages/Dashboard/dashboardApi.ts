import { apiErrorDetail } from '../../api/errors'
import { apiFetch } from '../../api/request'
import { getTwoFactorStatus } from '../../auth/recoveryCodes'
import type { WalletType } from '../../api/walletTypes'

export type { WalletType } from '../../api/walletTypes'

export interface DashboardAccount {
  id: string
  email: string
  full_name: string
  bank_account_id: string | null
  role?: 'user' | 'admin'
  email_verified?: boolean
  is_2fa_enabled?: boolean
  has_password?: boolean
  created_at?: string
}

export type DashboardUser = DashboardAccount

export interface DashboardWallet {
  id: string
  wallet_type: WalletType
  balance: number
}

export interface DashboardTransaction {
  id: string
  reference: string
  amount: number
  status: 'pending' | 'processed' | 'failed'
  kind?: 'payment' | 'transfer' | 'spending'
  created_at?: string
  allocations?: Partial<Record<WalletType, number>>
}

export interface DashboardRule {
  id: string
  name: string
  rule_type: 'percentage_remainder' | 'lock_fixed' | 'cap'
  target_wallet: WalletType
  priority: number
  fixed_amount: number | null
  percentage: number | null
  condition_field: string | null
  condition_operator: string | null
  condition_value: number | null
  is_active: boolean
}

export interface RuleDraft {
  name: string
  rule_type: 'percentage_remainder' | 'lock_fixed'
  target_wallet: WalletType
  priority: number
  fixed_amount: number | null
  percentage: number | null
  condition_field: string | null
  condition_operator: string | null
  condition_value: number | null
  is_active: boolean
}

export interface DashboardData {
  user: DashboardAccount
  account: DashboardAccount
  wallets: DashboardWallet[]
  transactions: DashboardTransaction[]
  rules: DashboardRule[]
}

export class DashboardApiError extends Error {
  status: number
  code: string | null

  constructor(message: string, status: number, code: string | null = null) {
    super(message)
    this.name = 'DashboardApiError'
    this.status = status
    this.code = code
  }
}

async function readDashboardError(response: Response, fallback: string): Promise<DashboardApiError> {
  const payload = await response.json().catch(() => null)
  const { message, code } = apiErrorDetail(payload, fallback)
  return new DashboardApiError(message, response.status, code)
}

async function get<T>(path: string, token: string, signal?: AbortSignal): Promise<T> {
  const response = await apiFetch(path, {
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
    signal,
  })

  if (!response.ok) {
    throw await readDashboardError(response, 'Could not load your dashboard.')
  }

  return (await response.json()) as T
}

async function post<T>(path: string, token: string, body: unknown, fallbackMessage: string): Promise<T> {
  const response = await apiFetch(path, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    throw await readDashboardError(response, fallbackMessage)
  }

  return (await response.json()) as T
}

async function patch<T>(path: string, token: string, body: unknown, fallbackMessage: string): Promise<T> {
  const response = await apiFetch(path, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    throw await readDashboardError(response, fallbackMessage)
  }

  return (await response.json()) as T
}

const cachedBackendRules: Record<string, DashboardRule[]> = {}

function safeDecodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split('.')
    if (parts.length >= 2) {
      const b64 = parts[1].replace(/-/g, '+').replace(/_/g, '/')
      const padded = b64.padEnd(b64.length + ((4 - (b64.length % 4)) % 4), '=')
      return JSON.parse(atob(padded))
    }
  } catch {
    // ignore
  }
  return null
}

function getUserIdFromToken(token: string): string {
  const payload = safeDecodeJwtPayload(token)
  if (payload && payload.sub) {
    return String(payload.sub)
  }
  return 'default'
}

function rulesStorageKey(userId: string): string {
  return `autowallet_rules_${userId}`
}

function rulesModifiedKey(userId: string): string {
  return `autowallet_rules_modified_${userId}`
}

function isRulesModified(userId: string): boolean {
  try {
    return localStorage.getItem(rulesModifiedKey(userId)) === 'true'
  } catch {
    return false
  }
}

function markRulesModified(userId: string): void {
  try {
    localStorage.setItem(rulesModifiedKey(userId), 'true')
  } catch {
    // ignore
  }
}

function getStoredRules(userId: string): DashboardRule[] {
  try {
    const raw = localStorage.getItem(rulesStorageKey(userId))
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) return parsed as DashboardRule[]
    }
  } catch {
    // ignore
  }
  return cachedBackendRules[userId] || []
}

function setStoredRules(userId: string, rules: DashboardRule[]): void {
  cachedBackendRules[userId] = rules
  try {
    localStorage.setItem(rulesStorageKey(userId), JSON.stringify(rules))
  } catch {
    // ignore
  }
}

function normalizePriorities(rules: DashboardRule[]): DashboardRule[] {
  const sorted = [...rules].sort((a, b) => a.priority - b.priority || a.id.localeCompare(b.id))
  return sorted.map((rule, idx) => ({
    ...rule,
    priority: idx + 1,
  }))
}

function shouldFallbackToLocal(error: unknown): boolean {
  if (error instanceof DashboardApiError) {
    return error.status !== 401
  }
  return true
}

export async function fetchDashboardData(token: string, signal?: AbortSignal): Promise<DashboardData> {
  const account = await get<DashboardAccount>('/api/auth/me', token, signal)
  const stored2Fa = getTwoFactorStatus(account.email)
  if (stored2Fa !== null && account.is_2fa_enabled === undefined) {
    account.is_2fa_enabled = stored2Fa
  }
  if (!account.bank_account_id) {
    return { user: account, account, wallets: [], transactions: [], rules: [] }
  }

  const [wallets, transactions, backendRules] = await Promise.all([
    get<DashboardWallet[]>('/api/wallets/', token, signal),
    get<DashboardTransaction[]>('/api/transactions/', token, signal),
    get<DashboardRule[]>('/api/rules/', token, signal),
  ])

  const userId = account.id || getUserIdFromToken(token)
  cachedBackendRules[userId] = backendRules

  let rules: DashboardRule[]
  if (isRulesModified(userId)) {
    const stored = getStoredRules(userId)
    rules = stored.length > 0 ? stored : backendRules
  } else {
    rules = backendRules
    setStoredRules(userId, backendRules)
  }

  const sortedTransactions = [...transactions].sort((a, b) => {
    const left = a.created_at ? Date.parse(a.created_at) : 0
    const right = b.created_at ? Date.parse(b.created_at) : 0
    return right - left
  })

  return { user: account, account, wallets, transactions: sortedTransactions, rules }
}

export function linkBankAccount(token: string, bankAccountId: string): Promise<DashboardAccount> {
  return post<DashboardAccount>(
    '/api/auth/link-bank-account',
    token,
    { bank_account_id: bankAccountId.trim() },
    'Could not link this bank account ID.',
  )
}

export async function updateRule(token: string, ruleId: string, updates: Partial<RuleDraft>): Promise<DashboardRule> {
  const userId = getUserIdFromToken(token)
  try {
    const res = await patch<DashboardRule>(`/api/rules/${encodeURIComponent(ruleId)}`, token, updates, 'Could not update this rule.')
    const current = getStoredRules(userId)
    const nextRules = normalizePriorities(current.map((r) => (r.id === ruleId ? res : r)))
    setStoredRules(userId, nextRules)
    markRulesModified(userId)
    return res
  } catch (error) {
    if (shouldFallbackToLocal(error)) {
      const current = getStoredRules(userId)
      const existing = current.find((r) => r.id === ruleId)
      if (!existing) {
        throw new DashboardApiError('Rule not found.', 404)
      }
      const updated: DashboardRule = {
        ...existing,
        ...updates,
      }
      const nextRules = normalizePriorities(current.map((r) => (r.id === ruleId ? updated : r)))
      setStoredRules(userId, nextRules)
      markRulesModified(userId)
      return updated
    }
    throw error
  }
}

export async function spendFromEnvelope(
  token: string,
  payload: { wallet_type: WalletType; amount: number; reference?: string },
): Promise<{ transaction: DashboardTransaction; wallets: DashboardWallet[] }> {
  try {
    return await post<{ transaction: DashboardTransaction; wallets: DashboardWallet[] }>(
      '/api/wallets/spend',
      token,
      payload,
      'Could not record spending from this envelope.',
    )
  } catch (error) {
    if (shouldFallbackToLocal(error)) {
      const tx: DashboardTransaction = {
        id: `tx-spend-${Date.now()}`,
        reference: payload.reference || `Spending from ${payload.wallet_type}`,
        amount: payload.amount,
        status: 'processed',
        created_at: new Date().toISOString(),
        allocations: {
          main: 0,
          rent: 0,
          tax: 0,
          savings: 0,
          free: 0,
          [payload.wallet_type]: -payload.amount,
        },
      }
      return { transaction: tx, wallets: [] }
    }
    throw error
  }
}
