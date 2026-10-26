import { useEffect, useEffectEvent, useRef } from 'react'
import type { ReactNode, RefObject } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '../../utils/cn'

interface DialogProps {
  children: ReactNode
  labelledBy: string
  onClose: () => void
  dismissible?: boolean
  className?: string
  panelClassName?: string
  role?: 'dialog' | 'alertdialog'
  initialFocusRef?: RefObject<HTMLElement | null>
  placement?: 'center' | 'drawer'
}

const focusableSelector = 'button:not(:disabled), a[href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex="0"]'

/** Modal shell with focus trap/restore, Escape dismissal and background isolation. */
export function Dialog({
  children,
  labelledBy,
  onClose,
  dismissible = true,
  className,
  panelClassName = '',
  role = 'dialog',
  initialFocusRef,
  placement = 'center',
}: DialogProps) {
  const panelRef = useRef<HTMLElement>(null)
  const dismiss = useEffectEvent(() => { if (dismissible) onClose() })

  useEffect(() => {
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const root = document.getElementById('root')
    const wasInert = root?.inert ?? false
    const previousOverflow = document.body.style.overflow
    if (root) root.inert = true
    document.body.style.overflow = 'hidden'
    const focusable = () => [...(panelRef.current?.querySelectorAll<HTMLElement>(focusableSelector) ?? [])]
      .filter((element) => element.getClientRects().length > 0 && !element.closest('[hidden]'))
    const initial = panelRef.current?.querySelector<HTMLElement>('input:not(:disabled):not([readonly]), select:not(:disabled), textarea:not(:disabled)')
    const focusTarget = initialFocusRef?.current ?? initial ?? focusable()[0] ?? panelRef.current
    focusTarget?.focus()

    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { event.preventDefault(); dismiss(); return }
      if (event.key !== 'Tab') return
      const elements = focusable()
      const first = elements[0]
      const last = elements.at(-1)
      if (!first) { event.preventDefault(); panelRef.current?.focus(); return }
      if (event.shiftKey && (document.activeElement === first || document.activeElement === panelRef.current)) {
        event.preventDefault(); last?.focus()
      } else if (!event.shiftKey && (document.activeElement === last || !panelRef.current?.contains(document.activeElement))) {
        event.preventDefault(); first.focus()
      }
    }
    document.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('keydown', handleKey)
      if (root) root.inert = wasInert
      document.body.style.overflow = previousOverflow
      if (previousFocus?.isConnected) previousFocus.focus({ preventScroll: true })
    }
  }, [initialFocusRef])

  return createPortal(
    <div
      className={cn(
        'fixed inset-0 z-[80] flex overflow-y-auto bg-brand-ink/50',
        placement === 'center' ? 'items-center justify-center p-5 max-sm:p-4' : 'items-stretch justify-end p-0',
        className,
      )}
      onMouseDown={(event) => { if (event.target === event.currentTarget && dismissible) onClose() }}
    >
      <section
        ref={panelRef}
        role={role}
        aria-modal="true"
        aria-labelledby={labelledBy}
        tabIndex={-1}
        className={cn(
          'w-full bg-surface shadow-modal outline-none',
          placement === 'center'
            ? 'max-h-[calc(100dvh-2.5rem)] overflow-y-auto overscroll-contain rounded-[18px] max-sm:max-h-[calc(100dvh-2rem)]'
            : 'h-dvh max-h-dvh overflow-y-auto',
          panelClassName,
        )}
      >
        {children}
      </section>
    </div>,
    document.body,
  )
}
