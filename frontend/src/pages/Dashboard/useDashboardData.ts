import { useEffect, useEffectEvent, useRef, useState } from 'react'
import type { DashboardData } from './dashboardApi'
import { DashboardApiError, fetchDashboardData } from './dashboardApi'
import { getToken } from '../../auth/session'

interface Options {
  onMissingToken: () => void
  onUnauthorized: () => void
}

/** Owns the dashboard's account/resource read and its loading/error flags. */
export function useDashboardData({ onMissingToken, onUnauthorized }: Options) {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)
  const callbacks = useRef({ onMissingToken, onUnauthorized })

  useEffect(() => {
    callbacks.current = { onMissingToken, onUnauthorized }
  })

  const loadDashboard = async (showSpinner = false) => {
    const token = getToken()
    if (!token) {
      callbacks.current.onMissingToken()
      return
    }

    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller
    if (showSpinner) setLoading(true)
    else setRefreshing(true)
    setError(null)

    try {
      const nextData = await fetchDashboardData(token, controller.signal)
      if (!controller.signal.aborted) setData(nextData)
    } catch (reason) {
      if (controller.signal.aborted || (reason instanceof DOMException && reason.name === 'AbortError')) return
      if (reason instanceof DashboardApiError && reason.status === 401) {
        callbacks.current.onUnauthorized()
        return
      }
      setError(reason instanceof Error ? reason.message : 'Could not load your dashboard.')
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false)
        setRefreshing(false)
      }
    }
  }

  useEffect(() => () => abortRef.current?.abort(), [])

  const initialLoad = useEffectEvent(() => {
    void loadDashboard(true)
  })

  useEffect(() => {
    queueMicrotask(() => initialLoad())
  }, [])

  return { data, loading, refreshing, error, loadDashboard }
}
