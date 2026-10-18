import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { readAccessToken } from '../../auth/session'
import { getPaymentAlerts } from '../Settings/settingsPreferences'
import { DashboardApiError, dashboardResources, fetchDashboardResources, fetchDashboardUser } from './dashboardApi'
import type { DashboardData, DashboardResource, DashboardTransaction, DashboardUser } from './dashboardApi'

const cacheLifetime = 30000

// Each signed-in dashboard owns its cache. Unknown resources never count as empty reads.
export function useDashboardData(resources: readonly DashboardResource[], onSessionEnded: () => void, onPayment: (payment: DashboardTransaction) => void) {
  const key = resources.join(',')
  const required = useMemo(() => key ? key.split(',') as DashboardResource[] : [], [key])
  const cache = useRef<DashboardData | null>(null)
  const accountCache = useRef<DashboardUser | null>(null)
  const accountRead = useRef(0)
  const readTimes = useRef<Partial<Record<DashboardResource, number>>>({})
  const completed = useRef(new Set<DashboardResource>())
  const pending = useRef<{ controller: AbortController; resources: DashboardResource[]; promise: Promise<void> } | null>(null)
  const [data, setData] = useState<DashboardData | null>(null)
  const [account, setAccount] = useState<DashboardUser | null>(null)
  const [loaded, setLoaded] = useState<DashboardResource[]>([])
  const [loading, setLoading] = useState(true)
  const [accountError, setAccountError] = useState<string | null>(null)

  const load = useCallback(async (force = true) => {
    const token = readAccessToken()
    if (!token) { onSessionEnded(); return }
    const fresh = (resource: DashboardResource) => Date.now() - (readTimes.current[resource] ?? 0) < cacheLifetime
    const needed = force ? dashboardResources.filter(resource => required.includes(resource) || completed.current.has(resource)) : required.filter(resource => !fresh(resource))
    if (!force && pending.current && !pending.current.controller.signal.aborted && needed.every(resource => pending.current!.resources.includes(resource))) {
      await pending.current.promise
      return
    }
    const accountFresh = accountCache.current !== null && Date.now() - accountRead.current < cacheLifetime
    if (!force && accountFresh && needed.length === 0) return

    pending.current?.controller.abort()
    const controller = new AbortController()
    const signal = controller.signal
    setLoading(true)
    setAccountError(null)
    // Invalidate all cached resources on mutations/live refresh, including failed reads.
    if (force) readTimes.current = {}
    const run = async () => {
      try {
        const user = !force && accountFresh ? accountCache.current! : await fetchDashboardUser(token, signal)
        signal.throwIfAborted()
        accountCache.current = user
        if (force || !accountFresh) accountRead.current = Date.now()
        setAccount(user)
        if (needed.length === 0) return
        const result = await fetchDashboardResources(user, token, signal, needed)
        signal.throwIfAborted()
        const previous = cache.current
        const latest = result.transactions[0]
        if (needed.includes('transactions') && !result.resourceErrors?.transactions && completed.current.has('transactions') &&
            !previous?.resourceErrors?.transactions && previous?.user.id === user.id && latest &&
            !previous.transactions.some(payment => payment.id === latest.id) && getPaymentAlerts(user.id)) onPayment(latest)

        const merged: DashboardData = { user, wallets: previous?.wallets ?? [], transactions: previous?.transactions ?? [], rules: previous?.rules ?? [] }
        const errors = { ...previous?.resourceErrors }
        for (const resource of needed) {
          if (resource === 'wallets') merged.wallets = result.wallets
          else if (resource === 'rules') merged.rules = result.rules
          else merged.transactions = result.transactions
          delete errors[resource]
          if (result.resourceErrors?.[resource]) errors[resource] = result.resourceErrors[resource]
          completed.current.add(resource)
          readTimes.current[resource] = result.resourceErrors?.[resource] ? 0 : Date.now()
        }
        if (Object.keys(errors).length) merged.resourceErrors = errors
        cache.current = merged
        setData(merged)
        setLoaded([...completed.current])
      } catch (reason) {
        if (signal.aborted) return
        if (reason instanceof DashboardApiError && reason.status === 401) { onSessionEnded(); return }
        accountRead.current = 0
        setAccountError('We could not load your account. Check your connection and try again.')
      } finally {
        if (pending.current?.controller === controller) {
          pending.current = null
          if (!signal.aborted) setLoading(false)
        }
      }
    }
    // Install the pending read before its first asynchronous completion.
    const promise = Promise.resolve().then(run)
    pending.current = { controller, resources: needed, promise }
    await promise
  }, [required, onSessionEnded, onPayment])

  useEffect(() => () => pending.current?.controller.abort(), [])
  const failures = required.flatMap(resource => data?.resourceErrors?.[resource] ? [data.resourceErrors[resource]!] : [])
  const error = accountError ?? (failures.length ? `${failures.join(' ')} Other available pages can still be used.` : null)
  const ready = required.every(resource => loaded.includes(resource))
  const status = error ? 'unavailable' : loading || !ready ? 'checking' : 'connected'
  return { data, account, loading, loaded, ready, error, status, load }
}
