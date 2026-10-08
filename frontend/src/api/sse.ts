// Server-Sent Events read with fetch(), so the request can carry the Authorization header
// (the browser's EventSource cannot) and can be a POST (the AI question).

export interface ServerEvent {
  event: string
  data: string
}

function parseEvent(block: string): ServerEvent | null {
  let event = 'message'
  const data: string[] = []
  for (const line of block.split('\n')) {
    if (line.startsWith(':')) continue // a comment, like the server's keep-alive
    const colon = line.indexOf(':')
    const field = colon === -1 ? line : line.slice(0, colon)
    let value = colon === -1 ? '' : line.slice(colon + 1)
    if (value.startsWith(' ')) value = value.slice(1)
    if (field === 'event') event = value
    else if (field === 'data') data.push(value)
  }
  return data.length > 0 ? { event, data: data.join('\n') } : null
}

/** Calls onEvent for each event of a text/event-stream response, until the server closes it. */
export async function readServerEvents(response: Response, onEvent: (event: ServerEvent) => void) {
  if (!response.body) return
  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  for (;;) {
    const { value, done } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })

    // An event ends with an empty line.
    let end = buffer.indexOf('\n\n')
    while (end !== -1) {
      const event = parseEvent(buffer.slice(0, end))
      buffer = buffer.slice(end + 2)
      if (event) onEvent(event)
      end = buffer.indexOf('\n\n')
    }
  }
}
