import { useCallback, useSyncExternalStore } from 'react'

function supported() {
  return typeof window !== 'undefined' && typeof window.matchMedia === 'function'
}

/** Subscribe to a CSS media query so layout code can react before rendering. */
export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback((onChange: () => void) => {
    if (!supported()) return () => {}
    const list = window.matchMedia(query)
    list.addEventListener('change', onChange)
    return () => list.removeEventListener('change', onChange)
  }, [query])

  return useSyncExternalStore(
    subscribe,
    () => (supported() ? window.matchMedia(query).matches : false),
    () => false,
  )
}
