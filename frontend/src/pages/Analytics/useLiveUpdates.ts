import { useEffect, useRef, useState } from 'react'
import { apiFetch } from '../../api/client'
import { readServerEvents } from '../../api/sse'
import { useSessionEnded } from '../../hooks/useSessionEnded'
import type { PaymentEvent } from './api'

export type LiveStatus = 'connecting' | 'live' | 'offline'

const FIRST_RETRY_MS = 2_000
const MAX_RETRY_MS = 30_000

/** Listens to /api/analytics/live and calls onPayment for each processed payment. Reconnects when the stream drops. */
export function useLiveUpdates(onPayment: (payment: PaymentEvent) => void): LiveStatus {
  const [status, setStatus] = useState<LiveStatus>('connecting')
  const onPaymentRef = useRef(onPayment)
  const sessionEnded = useSessionEnded()

  // Keep the latest callback without reconnecting the stream.
  useEffect(() => {
    onPaymentRef.current = onPayment
  })

  useEffect(() => {
    const controller = new AbortController()
    let retryTimer: number | undefined
    let retryDelay = FIRST_RETRY_MS

    async function listen() {
      try {
        const response = await apiFetch('/api/analytics/live', { signal: controller.signal })
        await readServerEvents(response, ({ event, data }) => {
          if (event === 'ready') {
            setStatus('live')
            retryDelay = FIRST_RETRY_MS
          } else if (event === 'payment') {
            onPaymentRef.current(JSON.parse(data) as PaymentEvent)
          }
        })
      } catch (error) {
        if (controller.signal.aborted || sessionEnded(error)) return
      }
      if (controller.signal.aborted) return

      // The server closed the stream or could not be reached: try again, waiting longer each time.
      setStatus('offline')
      retryTimer = window.setTimeout(() => {
        setStatus('connecting')
        listen()
      }, retryDelay)
      retryDelay = Math.min(retryDelay * 2, MAX_RETRY_MS)
    }

    listen()
    return () => {
      controller.abort()
      window.clearTimeout(retryTimer)
    }
  }, [sessionEnded])

  return status
}
