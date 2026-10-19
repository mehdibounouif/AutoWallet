import { createContext, useContext, useEffect, useId, useState } from 'react'
import type { Blocker } from 'react-router-dom'
import { readAccessToken } from '../auth/session'

export interface NavigationProtection {
  id: string
  sessionToken: string | null
  pending: boolean
  isActive?: () => boolean
}

export interface NavigationProtectionOptions {
  allowSignedOut?: boolean
  isActive?: () => boolean
}

export const NavigationProtectionContext = createContext<{
  register: (protection: NavigationProtection) => () => void
  blocker: Blocker
  blockedId: string | null
} | null>(null)

// The app router coordinates route changes; unload protection also works in isolated views.
export function useNavigationProtection(active: boolean, pending = true, { allowSignedOut = false, isActive }: NavigationProtectionOptions = {}) {
  const context = useContext(NavigationProtectionContext)
  const register = context?.register
  const id = useId()
  const [sessionToken] = useState(readAccessToken)

  useEffect(() => {
    if (!active || (!sessionToken && !allowSignedOut)) return
    const unregister = register?.({ id, sessionToken, pending, isActive })
    const warn = (event: BeforeUnloadEvent) => {
      if (sessionToken !== readAccessToken() || (isActive && !isActive())) return
      event.preventDefault()
      event.returnValue = ''
    }
    window.addEventListener('beforeunload', warn)
    return () => {
      unregister?.()
      window.removeEventListener('beforeunload', warn)
    }
  }, [active, allowSignedOut, id, isActive, pending, register, sessionToken])

  if (!active || sessionToken !== readAccessToken() || !context) return null
  // Only the protection that intercepted navigation should display a prompt.
  return context.blocker.state !== 'blocked' || context.blockedId === id ? context.blocker : null
}
