export class AssistantApiError extends Error {
  status: number
  constructor(status: number, message: string) { super(message); this.status = status }
}

export async function streamAssistant(message: string, token: string, signal: AbortSignal, onToken: (text: string) => void) {
  const response = await fetch('/api/ai/chat/stream', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', Accept: 'text/event-stream' },
    body: JSON.stringify({ message }),
    signal: AbortSignal.any([signal, AbortSignal.timeout(90000)]),
  })
  if (!response.ok) {
    const payload = await response.json().catch(() => ({}))
    const fallback = response.status === 429 ? 'Too many questions. Wait a moment before trying again.' : response.status === 503 ? 'The assistant is unavailable right now. Please try again later.' : 'The assistant could not answer. Please try again.'
    throw new AssistantApiError(response.status, typeof payload.detail === 'string' ? payload.detail : typeof payload.detail?.message === 'string' ? payload.detail.message : fallback)
  }
  if (!response.body || !response.headers.get('content-type')?.includes('text/event-stream')) throw new Error('The assistant returned an unexpected response.')
  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  let finished = false
  const consume = (block: string) => {
    let event = 'message'
    const lines: string[] = []
    for (const line of block.split(/\r?\n/)) {
      if (line.startsWith('event:')) event = line.slice(6).trim()
      if (line.startsWith('data:')) lines.push(line.slice(5).trimStart())
    }
    if (!lines.length) return
    const payload: unknown = JSON.parse(lines.join('\n'))
    if (typeof payload !== 'object' || payload === null) throw new Error('The assistant returned an invalid response.')
    if (event === 'error') throw new Error('message' in payload && typeof payload.message === 'string' ? payload.message : 'The answer was interrupted. Please try again.')
    if (event === 'done') finished = true
    if (event === 'token' && 'text' in payload && typeof payload.text === 'string') onToken(payload.text)
  }
  try {
    while (!finished) {
      const { value, done } = await reader.read()
      buffer += decoder.decode(value, { stream: !done })
      let separator: RegExpExecArray | null
      while ((separator = /\r?\n\r?\n/.exec(buffer))) {
        const block = buffer.slice(0, separator.index)
        buffer = buffer.slice(separator.index + separator[0].length)
        consume(block)
        if (finished) break
      }
      if (done) { if (buffer.trim() && !finished) consume(buffer); break }
    }
    if (!finished) throw new Error('The connection ended before the answer finished. Please try again.')
  } finally { await reader.cancel().catch(() => {}); reader.releaseLock() }
}
