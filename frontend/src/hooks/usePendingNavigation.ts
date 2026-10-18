import { useEffect, useState } from 'react'
import { useBlocker } from 'react-router-dom'
import { readAccessToken } from '../auth/session'

// Keep writes mounted until their result is reconciled; session cleanup always wins.
export function usePendingNavigation(pending: boolean) {
  const [sessionToken] = useState(readAccessToken)
  const blocker = useBlocker(({ currentLocation, nextLocation }) =>
    pending && sessionToken !== null && sessionToken === readAccessToken() && currentLocation.pathname !== nextLocation.pathname)
  useEffect(() => {
    if (!pending) return
    const warn = (event: BeforeUnloadEvent) => {
      if (sessionToken !== readAccessToken()) return
      event.preventDefault()
      event.returnValue = ''
    }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [pending, sessionToken])
  useEffect(() => {
    if (!pending && blocker.state === 'blocked') blocker.reset()
  }, [pending, blocker])
  return blocker.state === 'blocked'
}
