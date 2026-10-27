import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import type { DashboardData } from './dashboardApi'
import { AssistantApiError, describeUserData, streamAssistant } from '../../api/assistantApi'
import { hasCompleteSplit } from './paymentUtils'
import { getToken } from '../../auth/session'
import { useTranslation } from '../../i18n'
import { Alert } from '../../components/ui/Alert'
import { Page } from '../../components/ui/Page'
import { AssistantComposer } from './assistant/AssistantComposer'
import { AssistantMessage } from './assistant/AssistantMessage'
import type { ChatMessage } from './assistant/types'

export function AssistantView({ data, online, onSessionEnded }: {
  data: DashboardData
  online: boolean
  onSessionEnded: () => void
}) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const initialQuestion = typeof location.state?.question === 'string' ? location.state.question.slice(0, 2000) : ''
  const [draft, setDraft] = useState(initialQuestion)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [chartOpen, setChartOpen] = useState(false)
  const [copied, setCopied] = useState<string | null>(null)
  const active = useRef<AbortController | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const mounted = useRef(true)
  const latestQuestion = useRef('')

  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
      active.current?.abort()
    }
  }, [])

  useEffect(() => {
    const thread = scrollRef.current
    if (thread && thread.scrollHeight - thread.scrollTop - thread.clientHeight < 220) thread.scrollTop = thread.scrollHeight
  }, [messages, busy])

  const ask = async (question: string, regenerate = false) => {
    const trimmed = question.trim()
    if (!trimmed || trimmed.length > 2000 || active.current || !online) return
    const token = getToken()
    if (!token) {
      onSessionEnded()
      return
    }
    const controller = new AbortController()
    active.current = controller
    latestQuestion.current = trimmed
    setBusy(true)
    setError(null)
    setDraft('')
    const id = crypto.randomUUID()
    const answer: ChatMessage = { id, role: 'assistant', text: '', source: 'External model' }
    const history = regenerate ? messages.slice(0, messages.findLastIndex((item) => item.role === 'user')) : messages
    setMessages([...history, { id: crypto.randomUUID(), role: 'user', text: trimmed }, answer])

    // The API accepts one message. Include recent text only when it fits its 2,000 character limit.
    const prefix = 'Recent conversation:\n'
    const suffix = `\nCurrent question: ${trimmed}`
    const budget = 2000 - prefix.length - suffix.length
    const recent = history.filter((item) => !item.chart && !item.preview && item.text).slice(-4).map((item) => `${item.role}: ${item.text}`).join('\n')
    const request = recent && budget > 100 ? `${prefix}${recent.slice(-budget)}${suffix}` : trimmed

    try {
      await streamAssistant(
        request,
        token,
        controller.signal,
        (text) => {
          if (mounted.current) {
            setMessages((items) => items.map((item) => (item.id === id ? { ...item, text: item.text + text } : item)))
          }
        },
        describeUserData(data),
      )
    } catch (reason) {
      if (!mounted.current) return
      if (controller.signal.aborted) {
        setMessages((items) => items.map((item) => (item.id === id ? { ...item, stopped: true } : item)))
      } else if (reason instanceof AssistantApiError && reason.status === 401) {
        onSessionEnded()
      } else {
        setError(reason instanceof Error ? reason.message : 'I couldn’t answer that. Nothing in your account changed.')
      }
    } finally {
      if (active.current === controller) active.current = null
      if (mounted.current) {
        setBusy(false)
        inputRef.current?.focus()
      }
    }
  }

  const addChart = (kind: 'balances' | 'payment') => {
    const payment = data.transactions.find((item) => item.status === 'processed' && hasCompleteSplit(item))
    const chart = kind === 'balances'
      ? Object.fromEntries(data.wallets.map((wallet) => [wallet.wallet_type, wallet.balance]))
      : payment?.allocations
    if (!chart) return
    setMessages((items) => [...items, {
      id: crypto.randomUUID(),
      role: 'assistant',
      text: kind === 'balances' ? 'Your current envelope balances (MAD)' : `Recorded split for ${payment!.reference} (MAD)`,
      source: 'Local engine',
      chart,
    }])
    setChartOpen(false)
  }

  const localPreview = () => {
    setMessages((items) => [...items,
      { id: crypto.randomUUID(), role: 'user', text: 'What would 12,000.00 MAD do?' },
      { id: crypto.randomUUID(), role: 'assistant', text: 'Here’s a preview using your current rules and balances. Your account has not changed.', source: 'Local engine', preview: 12000 },
    ])
  }

  const copyMessage = async (message: ChatMessage) => {
    try {
      await navigator.clipboard?.writeText(message.text)
      setCopied(message.id)
    } catch {
      setCopied(null)
    }
  }

  const lastAnswer = messages.findLast((item) => item.role === 'assistant' && item.source === 'External model')
  const canAddPaymentChart = data.transactions.some((item) => item.status === 'processed' && hasCompleteSplit(item))

  return (
    <Page as="section" width="focus" className="flex min-h-0 flex-1 flex-col" aria-label="Assistant">
      <div ref={scrollRef} className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain px-2 py-6 max-md:px-1 max-md:py-6" role="log" aria-label="Conversation" aria-relevant="additions">
        {messages.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center text-center">
            <h1 className="text-[26px] font-extrabold tracking-[-0.02em] text-ink max-md:text-[23px]">{t.assistantHeading}</h1>
            <p className="mt-3 max-w-[620px] text-sm leading-relaxed text-muted max-md:text-xs">{t.assistantWelcomeDesc}</p>
          </div>
        ) : (
          <div className="flex flex-col gap-7">
            {messages.map((message) => (
              <AssistantMessage
                key={message.id}
                message={message}
                data={data}
                busy={busy}
                isLastAnswer={message.id === lastAnswer?.id}
                copied={copied === message.id}
                canRegenerate={online}
                onCopy={() => void copyMessage(message)}
                onRegenerate={() => void ask(latestQuestion.current, true)}
              />
            ))}
          </div>
        )}

        {error && (
          <Alert
            tone="danger"
            className="mt-6"
            action={
              <button type="button" onClick={() => void ask(latestQuestion.current, true)} disabled={busy || !online} className="shrink-0 text-xs font-bold underline disabled:opacity-50">
                Try again
              </button>
            }
          >
            <strong className="block font-bold">I couldn’t finish that answer.</strong>
            <p className="mt-1">{error}</p>
            <span className="mt-1 block text-2xs opacity-80">Nothing in your account changed.</span>
            {error.includes('Settings') && (
              <button
                type="button"
                className="mt-2 text-xs font-semibold underline"
                onClick={() => navigate('/app/settings', { state: { section: 'developer' } })}
              >
                Configure API key in Settings
              </button>
            )}
          </Alert>
        )}
      </div>

      <AssistantComposer
        draft={draft}
        onDraftChange={setDraft}
        onSubmit={() => void ask(draft)}
        onStop={() => active.current?.abort()}
        onStarter={(question) => void ask(question)}
        onLocalPreview={localPreview}
        busy={busy}
        online={online}
        showStarters={messages.length === 0}
        chartOpen={chartOpen}
        onToggleChart={() => setChartOpen((value) => !value)}
        onCloseChart={() => setChartOpen(false)}
        onAddChart={addChart}
        canAddPaymentChart={canAddPaymentChart}
        inputRef={inputRef}
      />
    </Page>
  )
}
