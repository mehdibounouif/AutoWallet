import type { ReactNode, RefObject } from 'react'
import { useDismissibleLayer } from '../../hooks/useDismissibleLayer'
import { cn } from '../../utils/cn'

/** Positioned layer that closes on outside pointerdown or Escape. */
export function Popover({ open, onClose, triggerRef, align = 'end', position = 'absolute', className, children }: {
  open: boolean
  onClose: () => void
  triggerRef?: RefObject<HTMLElement | null>
  align?: 'start' | 'end'
  position?: 'absolute' | 'fixed'
  className?: string
  children: ReactNode
}) {
  const layerRef = useDismissibleLayer(open, onClose, triggerRef)
  if (!open) return null
  return (
    <div
      ref={layerRef}
      className={cn(
        'z-50 rounded-xl border border-line bg-surface text-xs shadow-popover',
        position === 'absolute' && 'absolute top-[calc(100%+10px)]',
        position === 'absolute' && (align === 'end' ? 'end-0' : 'start-0'),
        position === 'fixed' && 'fixed',
        className,
      )}
    >
      {children}
    </div>
  )
}
