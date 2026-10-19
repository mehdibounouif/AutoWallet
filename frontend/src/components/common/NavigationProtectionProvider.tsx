import { useCallback, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { useBlocker } from 'react-router-dom'
import { readAccessToken } from '../../auth/session'
import { NavigationProtectionContext } from '../../hooks/navigationProtection'
import type { NavigationProtection } from '../../hooks/navigationProtection'

export function NavigationProtectionProvider({ children }: { children: ReactNode }) {
  const [protections, setProtections] = useState<NavigationProtection[]>([])
  const [blockedId, setBlockedId] = useState<string | null>(null)
  const register = useCallback((protection: NavigationProtection) => {
    setProtections(current => [...current, protection])
    return () => setProtections(current => current.filter(item => item.id !== protection.id))
  }, [])
  const blocker = useBlocker(({ currentLocation, nextLocation }) => {
    if (currentLocation.pathname === nextLocation.pathname) return false
    const sessionProtections = protections.filter(item => item.sessionToken === readAccessToken() && (!item.isActive || item.isActive()))
    // A pending dialog takes precedence over recovery codes visible behind it.
    const protection = sessionProtections.find(item => item.pending) ?? sessionProtections[0]
    if (!protection) return false
    setBlockedId(protection.id)
    return true
  })

  // Completing a write keeps the user on its result rather than following an old Back action.
  useEffect(() => {
    if (blocker.state === 'blocked' && !protections.some(item => item.id === blockedId)) blocker.reset()
  }, [protections, blockedId, blocker])

  return <NavigationProtectionContext.Provider value={{ register, blocker, blockedId }}>{children}</NavigationProtectionContext.Provider>
}
