import { useNavigationProtection } from './navigationProtection'
import type { NavigationProtectionOptions } from './navigationProtection'

// Keep writes mounted until their result is reconciled; session cleanup always wins.
export function usePendingNavigation(pending: boolean, options?: NavigationProtectionOptions) {
  const blocker = useNavigationProtection(pending, true, options)
  return blocker?.state === 'blocked'
}
