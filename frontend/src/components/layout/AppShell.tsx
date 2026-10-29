import type { ReactNode } from 'react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { WifiOff, X } from 'lucide-react'
import type { DashboardView } from './navigation'
import { navigationItems } from './navigation'
import { Sidebar } from './Sidebar'
import { MobileNav } from './MobileNav'
import { useTranslation } from '../../i18n'
import { cn } from '../../utils/cn'

interface AppShellProps {
  view: DashboardView
  onNavigate: (view: DashboardView) => void
  headerStart: ReactNode
  headerTools: ReactNode
  online: boolean
  toast?: string | null
  onDismissToast?: () => void
  children: ReactNode
}

/** Persistent chrome for every signed-in workspace view. */
export function AppShell({ view, onNavigate, headerStart, headerTools, online, toast, onDismissToast, children }: AppShellProps) {
  const { t } = useTranslation()
  const [collapsed, setCollapsed] = useState(false)
  const immersive = view === 'assistant'
  const notifications = view === 'notifications'

  return (
    <div className="flex min-h-dvh bg-canvas text-body">
      <Sidebar
        activeView={view}
        items={navigationItems}
        collapsed={collapsed}
        onNavigate={onNavigate}
        onToggleCollapsed={() => setCollapsed((value) => !value)}
      />

      <div className="min-w-0 flex-1">
        <header
          className={cn(
            'sticky top-0 z-20 flex h-16 items-center justify-between gap-2 border-b border-line bg-surface px-7',
            'max-[1100px]:px-5 max-md:px-3',
            notifications && 'max-md:hidden',
          )}
        >
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={() => onNavigate('home')}
              className="flex items-center gap-1.5 rounded-lg text-xs font-extrabold text-body md:hidden"
              aria-label="AutoWallet home"
            >
              <img src="/AW.svg" alt="" className="size-[27px] object-contain" />
              <span>AutoWallet</span>
            </button>
            {headerStart}
          </div>
          {headerTools}
        </header>

        {!online && (
          <div className="flex items-center gap-2 bg-warning-soft px-7 py-2.5 text-[13px] font-medium text-warning-ink max-md:px-4" role="status">
            <WifiOff className="size-4 shrink-0" aria-hidden="true" />
            <span>You&apos;re offline — showing the last loaded data.</span>
          </div>
        )}

        <main
          className={cn(
            'mx-auto w-full max-w-[1500px] px-8 pt-7 pb-8 max-[1100px]:px-6 max-md:px-4 max-md:pt-5',
            immersive && 'flex h-[calc(100dvh-64px)] min-h-0 flex-col pt-0 pb-0 max-md:h-[calc(100dvh-129px-env(safe-area-inset-bottom))] max-md:px-3',
            notifications && 'max-md:min-h-[calc(100dvh-65px)] max-md:pt-6 max-md:pb-[90px]',
            !immersive && !notifications && 'max-md:pb-[150px]',
          )}
        >
          {children}
          <footer
            className={cn(
              'mt-9 flex items-center gap-4.5 pb-2 text-2xs text-subtle max-md:mt-6 max-md:justify-center',
              immersive && 'hidden',
              notifications && 'max-md:hidden',
            )}
          >
            <Link to="/privacy" className="hover:text-accent hover:underline">{t.legalPrivacyTitle}</Link>
            <Link to="/terms" className="hover:text-accent hover:underline">{t.legalTermsTitle}</Link>
            <span className="ms-auto max-md:hidden">AutoWallet · All amounts in MAD</span>
          </footer>
        </main>
      </div>

      <MobileNav activeView={view} items={navigationItems} onNavigate={onNavigate} />

      {toast && (
        <div
          className="fixed end-6 bottom-6 z-[60] flex max-w-[320px] items-start gap-2.5 rounded-xl border border-line bg-surface p-4 text-[13px] font-semibold text-body shadow-popover max-md:inset-x-4 max-md:bottom-[calc(142px+env(safe-area-inset-bottom))] max-md:max-w-none"
          role="status"
        >
          <span className="min-w-0 flex-1">{toast}</span>
          <button
            type="button"
            onClick={onDismissToast}
            aria-label="Dismiss notification"
            className="shrink-0 text-subtle hover:text-ink"
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        </div>
      )}
    </div>
  )
}
