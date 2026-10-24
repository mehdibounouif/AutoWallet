import { apiErrorDetail } from './errors'
import { apiFetch } from './request'
import { readEventStream } from './sse'
import type { DashboardData } from '../pages/Dashboard/dashboardApi'

export class AssistantApiError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.name = 'AssistantApiError'
    this.status = status
  }
}

export interface AiConfig {
  apiKey: string
  baseUrl?: string
  model?: string
}

let memoryAiConfig: AiConfig | null = null

export function getStoredAiConfig(): AiConfig | null {
  return memoryAiConfig
}

export function saveStoredAiConfig(config: AiConfig | null): void {
  if (!config || !config.apiKey.trim()) {
    memoryAiConfig = null
  } else {
    memoryAiConfig = {
      apiKey: config.apiKey.trim(),
      baseUrl: config.baseUrl?.trim() || undefined,
      model: config.model?.trim() || undefined,
    }
  }
}

export const SYSTEM_PROMPT = `You are the AutoWallet assistant, a budgeting helper for freelancers in Morocco.
How AutoWallet works:
- Every payment the user receives is split into 5 envelopes: main, rent, tax, savings, free.
- The user's rules run in priority order (lowest number first) on what is left of the payment.
- A lock_fixed rule takes a fixed amount. A percentage_remainder rule takes a percentage of what is LEFT, not of the whole payment.
- A rule whose condition is false is skipped. Whatever is left at the end goes to main.
- Amounts are in Moroccan dirhams (MAD). AutoWallet is a budgeting ledger: it never moves real money.
How to answer:
- Answer in the same language as the user's question, short and practical.
- If you don't have the facts, say so. Never invent numbers.
- You are not a licensed financial or tax advisor: for tax or legal details, tell the user to check an official source or an accountant.`

export function describeUserData(data: DashboardData): string {
  const lines = ["The user's current data:", "Envelopes (balance in MAD):"]
  for (const w of data.wallets) {
    lines.push(`- ${w.wallet_type}: ${w.balance.toFixed(2)}`)
  }

  lines.push("Rules, in the order they run:")
  for (const r of data.rules) {
    let what = ''
    if (r.rule_type === 'lock_fixed') {
      what = `lock ${(r.fixed_amount ?? 0).toFixed(2)} MAD`
    } else {
      what = `take ${r.percentage ?? 0}% of what is left`
    }
    let condition = ''
    if (r.condition_field) {
      condition = ` (only if ${r.condition_field} ${r.condition_operator} ${r.condition_value})`
    }
    lines.push(`${r.priority}. ${r.name} -> ${r.target_wallet}: ${what}${condition}`)
  }

  lines.push("Last payments:")
  const recentPayments = data.transactions.slice(0, 5)
  for (const p of recentPayments) {
    const dateStr = p.created_at ? p.created_at.slice(0, 10) : 'recent'
    lines.push(`- ${dateStr}: ${p.amount.toFixed(2)} MAD (${p.status})`)
  }
  if (!recentPayments.length) {
    lines.push("- none yet")
  }
  return lines.join("\n")
}

async function streamDirectFromProvider(
  message: string,
  config: AiConfig,
  signal: AbortSignal,
  onToken: (text: string) => void,
  userDataText?: string,
) {
  const isGeminiKey = config.apiKey.startsWith('AIza')
  const defaultBaseUrl = isGeminiKey
    ? 'https://generativelanguage.googleapis.com/v1beta/openai'
    : 'https://api.openai.com/v1'
  const defaultModel = isGeminiKey ? 'gemini-1.5-flash' : 'gpt-4o-mini'

  const baseUrl = (config.baseUrl || defaultBaseUrl).replace(/\/+$/, '')
  const model = config.model || defaultModel
  const queryParam = isGeminiKey && baseUrl.includes('googleapis.com') ? `?key=${encodeURIComponent(config.apiKey)}` : ''
  const url = `${baseUrl}/chat/completions${queryParam}`

  const systemContent = SYSTEM_PROMPT + (userDataText ? `\n\n${userDataText}` : '')
  const messages = [
    { role: 'system', content: systemContent },
    { role: 'user', content: message },
  ]

  let response: Response
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages,
        stream: true,
      }),
      signal,
    })
  } catch (netErr) {
    if (signal.aborted) throw netErr
    throw new AssistantApiError(503, 'Could not connect to the AI service. Please check your network connection and API key.')
  }

  if (!response.ok) {
    const errorBody = await response.json().catch(() => null)
    const errMessage =
      errorBody?.error?.message ||
      `AI service returned HTTP ${response.status}. Please check your API key and model settings.`
    throw new AssistantApiError(response.status, errMessage)
  }

  let receivedAny = false
  await readEventStream(response, ({ data }) => {
    if (!data || data.trim() === '[DONE]') return false
    try {
      const parsed = JSON.parse(data)
      const chunk = parsed?.choices?.[0]?.delta?.content
      if (typeof chunk === 'string') {
        receivedAny = true
        onToken(chunk)
      }
    } catch {
      // skip partial or non-json lines
    }
  })

  if (!receivedAny && !signal.aborted) {
    throw new AssistantApiError(502, 'No response content was received from the AI provider.')
  }
}

export async function streamAssistant(
  message: string,
  token: string,
  signal: AbortSignal,
  onToken: (text: string) => void,
  userDataText?: string,
) {
  const localConfig = getStoredAiConfig()

  if (localConfig && localConfig.apiKey) {
    return streamDirectFromProvider(message, localConfig, signal, onToken, userDataText)
  }

  const response = await apiFetch('/api/ai/chat/stream', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', Accept: 'text/event-stream' },
    body: JSON.stringify({ message }),
    signal,
  }, 90000)

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}))
    if (response.status === 503) {
      throw new AssistantApiError(
        503,
        'The AI assistant is not configured on this server. Add your API key in Settings > API & webhooks to enable it.',
      )
    }
    const fallback =
      response.status === 429
        ? 'Too many questions. Wait a moment before trying again.'
        : 'The assistant could not answer. Please try again.'
    throw new AssistantApiError(response.status, apiErrorDetail(payload, fallback).message)
  }

  let finished = false
  await readEventStream(response, ({ event, data }) => {
    const payload: unknown = JSON.parse(data)
    if (typeof payload !== 'object' || payload === null) throw new Error('The assistant returned an invalid response.')
    if (event === 'error') throw new Error('message' in payload && typeof payload.message === 'string' ? payload.message : 'The answer was interrupted. Please try again.')
    if (event === 'done') { finished = true; return false }
    if (event === 'token' && 'text' in payload && typeof payload.text === 'string') onToken(payload.text)
  })

  if (!finished) throw new Error('The connection ended before the answer finished. Please try again.')
}
