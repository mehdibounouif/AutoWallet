import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowUp, Bot, Square } from 'lucide-react'
import { AccountLayout } from '../../components/account/AccountLayout'
import { ApiError, apiFetch } from '../../api/client'
import { readServerEvents } from '../../api/sse'
import { useSessionEnded } from '../../hooks/useSessionEnded'
import { FormattedAnswer } from './FormattedAnswer'

const MAX_LENGTH = 2000 // the API's limit (backend/app/ai/schemas.py)

const SUGGESTIONS = [
  'How was my last payment split?',
  'Why did my rent rule take nothing?',
  'How much is in my tax envelope?',
  'Explain my rules in simple words.',
]

interface Message {
  id: number
  role: 'user' | 'assistant'
  text: string
  status?: 'streaming' | 'done' | 'stopped' | 'error'
  error?: string
}

export function AssistantPage() {
  const sessionEnded = useSessionEnded()
  // The conversation lives only in this page's memory: AutoWallet does not save it (see the Privacy Policy).
  const [messages, setMessages] = useState<Message[]>([])
  const [draft, setDraft] = useState('')
  const [busy, setBusy] = useState(false)
  const controllerRef = useRef<AbortController | null>(null)
  const nextId = useRef(1)
  const endRef = useRef<HTMLDivElement>(null)

  // Follow the answer while it is written.
  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end' })
  }, [messages])

  // Leaving the page stops the answer.
  useEffect(() => {
    return () => controllerRef.current?.abort()
  }, [])

  function updateMessage(id: number, change: (message: Message) => Message) {
    setMessages((current) => current.map((message) => (message.id === id ? change(message) : message)))
  }

  async function ask(question: string) {
    const text = question.trim()
    if (!text || busy) return

    const answerId = nextId.current + 1
    nextId.current += 2
    setMessages((current) => [
      ...current,
      { id: answerId - 1, role: 'user', text },
      { id: answerId, role: 'assistant', text: '', status: 'streaming' },
    ])
    setDraft('')
    setBusy(true)
    const controller = new AbortController()
    controllerRef.current = controller

    try {
      const response = await apiFetch('/api/ai/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text }),
        signal: controller.signal,
      })
      let ended = false
      await readServerEvents(response, ({ event, data }) => {
        const payload = JSON.parse(data) as { text?: string; message?: string }
        if (event === 'token') {
          updateMessage(answerId, (message) => ({ ...message, text: message.text + (payload.text ?? '') }))
        } else if (event === 'done') {
          ended = true
          updateMessage(answerId, (message) => ({ ...message, status: 'done' }))
        } else if (event === 'error') {
          ended = true
          updateMessage(answerId, (message) => ({ ...message, status: 'error', error: payload.message }))
        }
      })
      if (!ended) {
        updateMessage(answerId, (message) => ({ ...message, status: 'error', error: 'The answer stopped before the end. Please ask again.' }))
      }
    } catch (error) {
      if (controller.signal.aborted) {
        updateMessage(answerId, (message) => ({ ...message, status: 'stopped' }))
      } else if (!sessionEnded(error)) {
        const reason = error instanceof ApiError ? error.message : 'AutoWallet cannot be reached right now. Please try again.'
        updateMessage(answerId, (message) => ({ ...message, status: 'error', error: reason }))
      }
    } finally {
      controllerRef.current = null
      setBusy(false)
    }
  }

  return (
    <AccountLayout title="AI assistant" subtitle="Questions about your envelopes, rules and payments, answered with your own AutoWallet data.">
      <div className="mx-auto max-w-3xl">
        <div role="log" aria-label="Conversation" aria-busy={busy} className="space-y-4 pb-4">
          {messages.length === 0 ? <Welcome onPick={ask} /> : messages.map((message) => <Bubble key={message.id} message={message} />)}
          <div ref={endRef} />
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault()
            ask(draft)
          }}
          className="sticky bottom-4 rounded-2xl border border-[#DDE3EA] bg-white p-3 shadow-md"
        >
          <label htmlFor="question" className="sr-only">
            Your question
          </label>
          <textarea
            id="question"
            value={draft}
            maxLength={MAX_LENGTH}
            rows={2}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              // Enter sends, Shift+Enter makes a new line.
              if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
                e.preventDefault()
                ask(draft)
              }
            }}
            placeholder="Ask about your envelopes, rules or payments…"
            className="block w-full resize-none bg-transparent px-2 py-1.5 text-sm text-[#1A2330] placeholder:text-[#7A879B] focus:outline-none"
          />
          <div className="mt-2 flex items-center justify-between gap-3">
            <span className="px-2 text-xs text-[#5E6B7E]">
              {draft.length} / {MAX_LENGTH}
            </span>
            {busy ? (
              <button
                type="button"
                onClick={() => controllerRef.current?.abort()}
                className="inline-flex items-center gap-2 h-9 px-4 rounded-[10px] border border-[#DDE3EA] text-sm font-medium text-[#1A2330] hover:bg-[#F3F6FA] cursor-pointer"
              >
                <Square className="w-3.5 h-3.5" aria-hidden="true" />
                Stop
              </button>
            ) : (
              <button
                type="submit"
                disabled={!draft.trim()}
                className="inline-flex items-center gap-2 h-9 px-4 rounded-[10px] bg-[#5A64B4] hover:bg-[#4A53A0] text-white text-sm font-medium cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ArrowUp className="w-4 h-4" aria-hidden="true" />
                Send
              </button>
            )}
          </div>
        </form>

        <p className="mt-6 text-center text-xs leading-5 text-[#5E6B7E]">
          Answers come from an AI model (Google Gemini) and can be wrong. They are not financial, tax or legal advice. Each
          question is answered on its own, and this conversation is not saved.{' '}
          <Link to="/terms" className="font-medium text-[#4A53A0] hover:underline">
            Terms of Service
          </Link>
        </p>
      </div>
    </AccountLayout>
  )
}

function Welcome({ onPick }: { onPick: (question: string) => void }) {
  return (
    <div className="rounded-2xl border border-[#DDE3EA] bg-white p-6 sm:p-8 text-center shadow-sm">
      <span className="mx-auto flex w-12 h-12 items-center justify-center rounded-2xl bg-[#ECEEFA] text-[#5A64B4]">
        <Bot className="w-7 h-7" aria-hidden="true" />
      </span>
      <h2 className="mt-4 text-lg font-semibold text-[#1A2330]">Ask about your money</h2>
      <p className="mx-auto mt-1 max-w-md text-sm text-[#5E6B7E]">
        The assistant reads your envelope balances, your rules and your last payments. Ask in English, French or Arabic:
        it answers in the language of your question.
      </p>
      <div className="mt-5 flex flex-wrap justify-center gap-2">
        {SUGGESTIONS.map((suggestion) => (
          <button
            key={suggestion}
            type="button"
            onClick={() => onPick(suggestion)}
            className="rounded-full border border-[#DDE3EA] bg-[#F3F6FA] px-3.5 py-2 text-sm text-[#3B495D] hover:border-[#8A95D2] hover:bg-[#ECEEFA] transition cursor-pointer"
          >
            {suggestion}
          </button>
        ))}
      </div>
    </div>
  )
}

function Bubble({ message }: { message: Message }) {
  if (message.role === 'user') {
    return (
      <div className="flex justify-end">
        <p className="max-w-[85%] whitespace-pre-wrap break-words rounded-2xl rounded-br-md bg-[#5A64B4] px-4 py-2.5 text-sm text-white">
          {message.text}
        </p>
      </div>
    )
  }

  const thinking = message.status === 'streaming' && !message.text
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 flex w-8 h-8 shrink-0 items-center justify-center rounded-xl bg-[#ECEEFA] text-[#5A64B4]">
        <Bot className="w-5 h-5" aria-hidden="true" />
      </span>
      <div className="min-w-0 max-w-[85%] rounded-2xl rounded-tl-md border border-[#DDE3EA] bg-white px-4 py-3 text-sm leading-6 text-[#1A2330] break-words">
        {thinking ? <span className="text-[#5E6B7E]">Thinking…</span> : message.text && <FormattedAnswer text={message.text} />}
        {message.status === 'stopped' && <p className="mt-1 text-xs text-[#5E6B7E]">You stopped this answer.</p>}
        {message.status === 'error' && (
          <p role="alert" className={`text-sm text-[#B02527] ${message.text ? 'mt-2' : ''}`}>
            {message.error ?? 'Something went wrong. Please try again.'}
          </p>
        )}
      </div>
    </div>
  )
}
