import { useState } from 'react'
import { Bell, ChevronDown, LogOut, RefreshCw, Settings } from 'lucide-react'
import type { DashboardAccount, DashboardTransaction } from './dashboardApi'
import type { LiveStatus } from './usePaymentLiveUpdates'
import { NotificationsView } from './NotificationsView'
import { LanguageSelector } from '../../components/ui/LanguageSelector'
import { Popover } from '../../components/ui/Popover'
import { useMediaQuery } from '../../hooks/useMediaQuery'
import { useTranslation } from '../../i18n'
import { cn } from '../../utils/cn'

interface DashboardHeaderToolsProps {
  account: DashboardAccount | null
  online: boolean
  liveStatus: LiveStatus
  refreshing: boolean
  unreadCount: number
  payments: DashboardTransaction[]
  readIds: string[]
  alertsEnabled: boolean
  onRefresh: () => void
  onRead: (ids: string[]) => void
  onSelectPayment: (payment: DashboardTransaction) => void
  onOpenNotifications: () => void
  onOpenSettings: () => void
  onSignOut: () => void
}

function initials(fullName: string) {
  const parts = fullName.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return 'AW'
  return parts.slice(0, 2).map((part) => part[0]?.toUpperCase() ?? '').join('')
}

export function DashboardHeaderTools({
  account,
  online,
  liveStatus,
  refreshing,
  unreadCount,
  payments,
  readIds,
  alertsEnabled,
  onRefresh,
  onRead,
  onSelectPayment,
  onOpenNotifications,
  onOpenSettings,
  onSignOut,
}: DashboardHeaderToolsProps) {
  const { t } = useTranslation()
  const mobile = useMediaQuery('(max-width: 767px)')
  const [open, setOpen] = useState<'status' | 'notifications' | 'profile' | null>(null)
  const [notificationsTrigger, setNotificationsTrigger] = useState<HTMLButtonElement | null>(null)
  const [profileTrigger, setProfileTrigger] = useState<HTMLButtonElement | null>(null)
  const [statusTrigger, setStatusTrigger] = useState<HTMLButtonElement | null>(null)

  const liveReady = online && liveStatus !== 'reconnecting'
  const statusLabel = !online ? t.statusOff : liveStatus === 'reconnecting' ? t.statusChecking : t.statusLive
  const statusTone = !online ? 'text-action-danger' : liveReady ? 'text-success-ink' : 'text-muted'

  const toggleNotifications = () => {
    if (mobile) onOpenNotifications()
    else setOpen((value) => (value === 'notifications' ? null : 'notifications'))
  }

  return (
    <div className="flex items-center gap-3.5 max-md:gap-0">
      <LanguageSelector compact />

      <div className="relative">
        <button
          ref={setStatusTrigger}
          type="button"
          onClick={() => setOpen((value) => (value === 'status' ? null : 'status'))}
          aria-expanded={open === 'status'}
          aria-label={statusLabel}
          className={cn(
            'inline-flex items-center gap-1.5 rounded-full border border-line px-2.5 py-1 text-2xs font-bold transition-colors hover:bg-canvas max-md:px-1.5',
            statusTone,
          )}
        >
          <span
            className={cn(
              'size-2 rounded-full',
              !online ? 'bg-action-danger' : liveReady ? 'bg-success' : 'bg-subtle',
            )}
            aria-hidden="true"
          />
          <span className="max-md:hidden">{statusLabel}</span>
          <span className="md:hidden">{!online ? t.statusOff : t.statusLive}</span>
        </button>
        <Popover open={open === 'status'} onClose={() => setOpen(null)} triggerRef={statusTrigger ? { current: statusTrigger } : undefined} className="w-[240px] p-4">
          <strong className="block text-xs font-bold text-ink">
            {!online ? t.statusOffline : liveStatus === 'reconnecting' ? t.statusReconnecting : t.statusConnected}
          </strong>
          <p className="mt-1.5 text-xs leading-relaxed text-muted">
            {!online ? t.statusOfflineDesc : liveStatus === 'reconnecting' ? t.statusReconnectingDesc : t.statusConnectedDesc}
          </p>
          <button
            type="button"
            onClick={() => {
              setOpen(null)
              onRefresh()
            }}
            className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-accent hover:underline"
          >
            <RefreshCw className={cn('size-3.5', refreshing && 'animate-spin')} aria-hidden="true" />
            {t.refreshNow}
          </button>
        </Popover>
      </div>

      <div className="relative">
        <button
          ref={setNotificationsTrigger}
          type="button"
          onClick={toggleNotifications}
          aria-label={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : 'Notifications'}
          aria-expanded={open === 'notifications'}
          className="relative grid size-8 place-items-center rounded-lg text-muted transition-colors hover:bg-canvas hover:text-ink max-md:size-10"
        >
          <Bell className="size-4" aria-hidden="true" />
          {unreadCount > 0 && (
            <span className="absolute end-0 top-0.5 min-w-[14px] rounded-full border border-white bg-body px-0.5 text-center text-[8px] leading-[12px] font-bold text-white">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
        {!mobile && (
          <Popover
            open={open === 'notifications'}
            onClose={() => setOpen(null)}
            triggerRef={notificationsTrigger ? { current: notificationsTrigger } : undefined}
            className="w-[400px] overflow-hidden p-0"
          >
            <NotificationsView
              payments={payments}
              readIds={readIds}
              unread={unreadCount}
              onRead={onRead}
              onSelect={(payment) => {
                setOpen(null)
                onSelectPayment(payment)
              }}
              onBack={() => {
                setOpen(null)
                onOpenNotifications()
              }}
              onSettings={() => {
                setOpen(null)
                onOpenSettings()
              }}
              enabled={alertsEnabled}
              compact
            />
          </Popover>
        )}
      </div>

      <div className="relative">
        <button
          ref={setProfileTrigger}
          type="button"
          onClick={() => setOpen((value) => (value === 'profile' ? null : 'profile'))}
          aria-label={t.accountMenu}
          aria-expanded={open === 'profile'}
          className="flex items-center gap-1.5 text-muted max-md:min-h-11 max-md:min-w-10 max-md:justify-center"
        >
          <span className="grid size-[29px] place-items-center rounded-full bg-layer text-2xs font-extrabold text-muted max-md:size-[26px]">
            {initials(account?.full_name ?? 'AutoWallet')}
          </span>
          <ChevronDown className="size-3.5 max-md:hidden" aria-hidden="true" />
        </button>
        <Popover open={open === 'profile'} onClose={() => setOpen(null)} triggerRef={profileTrigger ? { current: profileTrigger } : undefined} className="w-64 p-4">
          <strong className="block truncate text-xs font-bold text-ink">{account?.full_name ?? t.userFallback}</strong>
          <p className="truncate text-xs text-muted">{account?.email ?? ''}</p>
          <button
            type="button"
            onClick={() => {
              setOpen(null)
              onOpenSettings()
            }}
            className="mt-3 flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-start text-xs font-semibold text-body hover:bg-canvas"
          >
            <Settings className="size-3.5" aria-hidden="true" />
            {t.navSettings}
          </button>
          <button
            type="button"
            onClick={() => {
              setOpen(null)
              onSignOut()
            }}
            className="mt-1 flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-start text-xs font-semibold text-danger-ink hover:bg-danger-soft"
          >
            <LogOut className="size-3.5" aria-hidden="true" />
            {t.logOut}
          </button>
        </Popover>
      </div>
    </div>
  )
}
