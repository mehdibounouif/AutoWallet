import { useEffect, useEffectEvent, useRef } from 'react'
import type { RefObject } from 'react'

export function useDismissibleLayer(open: boolean, onDismiss: () => void, triggerRef?: RefObject<HTMLElement | null>) {
  const layerRef = useRef<HTMLDivElement>(null)
  const dismiss = useEffectEvent(onDismiss)
  const isInside = useEffectEvent((target: Node) => layerRef.current?.contains(target) || triggerRef?.current?.contains(target))

  useEffect(() => {
    if (!open) return
    const opener = layerRef.current?.querySelector<HTMLElement>('[aria-expanded="true"]')
      ?? triggerRef?.current?.querySelector<HTMLElement>('[aria-expanded="true"]')
      ?? (document.activeElement instanceof HTMLElement ? document.activeElement : null)
    const outside = (event: PointerEvent) => { if (!isInside(event.target as Node)) dismiss() }
    const escape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || event.defaultPrevented || document.querySelector('[aria-modal="true"]')) return
      // A filter bar can switch its active trigger without closing the layer.
      const currentOpener = layerRef.current?.querySelector<HTMLElement>('[aria-expanded="true"]')
        ?? triggerRef?.current?.querySelector<HTMLElement>('[aria-expanded="true"]')
        ?? opener
      event.preventDefault()
      dismiss()
      if (currentOpener?.isConnected) currentOpener.focus({ preventScroll: true })
    }
    document.addEventListener('pointerdown', outside)
    document.addEventListener('keydown', escape)
    return () => { document.removeEventListener('pointerdown', outside); document.removeEventListener('keydown', escape) }
  }, [open, triggerRef])

  return layerRef
}
