import { useEffect, useEffectEvent, useRef, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import {
  Activity,
  BarChart3,
  Bell,
  ChevronDown,
  ChevronRight,
  FlaskConical,
  House,
  LogOut,
  MoreHorizontal,
  PanelLeft,
  RefreshCw,
  Settings,
  SlidersHorizontal,
  Sparkles,
  Wallet,
  WifiOff,
  X,
} from 'lucide-react'
import { useRequestSignal } from '../../hooks/useRequestSignal'
import { clearTwoFactorCredentials } from '../../auth/pendingCredentials'
import { clearRecoveryCodes } from '../../auth/recoveryCodes'
import { safeReturnPath } from '../../auth/returnPath'
import {
  DashboardApiError,
  fetchDashboardData,
  linkBankAccount,
  spendFromEnvelope,
  updateRule,
} from './dashboardApi'
import type { DashboardData, DashboardTransaction, RuleDraft, WalletType } from './dashboardApi'
import { ActivitySkeleton, ActivityView } from './ActivityView'
import { AnalyticsView } from './AnalyticsView'
import { AssistantView } from './AssistantView'
import { EnvelopeDetailView } from './EnvelopeDetailView'
import { EnvelopesSkeleton, EnvelopesView } from './EnvelopesView'
import { envelopeMeta, money, walletOrder } from './envelopeDisplay'
import { HomeView, LoadingHome } from './HomeView'
import { NotificationsView } from './NotificationsView'
import { PaymentDetailView } from './PaymentDetailView'
import { RulesView } from './RulesView'
import { SandboxView } from './SandboxView'
import { newestPaymentsFirst } from './paymentUtils'
import { usePaymentLiveUpdates } from './usePaymentLiveUpdates'
import { usePaymentNotifications } from './usePaymentNotifications'
import { SettingsView } from '../Settings/SettingsView'
import { usePaymentAlerts } from '../Settings/settingsAlerts'
import { LanguageSelector } from '../../components/common/LanguageSelector'
import { useTranslation } from '../../i18n'
import './dashboard.css'
import './workspace.css'

type ActiveView = 'home' | 'activity' | 'envelopes' | 'rules' | 'analytics' | 'assistant' | 'sandbox' | 'settings' | 'notifications'
type HeaderPopover = 'status' | 'notifications' | 'profile' | 'more' | null

interface NavigationItem {
  id: ActiveView
  label: string
  icon: typeof House
  path?: string
  demo?: boolean
}

function isWalletType(value: string | undefined): value is WalletType {
  return Boolean(value && walletOrder.includes(value as WalletType))
}

function viewFromPath(pathname: string): ActiveView {
  if (pathname.startsWith('/app/envelopes')) return 'envelopes'
  if (pathname.startsWith('/app/rules')) return 'rules'
  if (pathname.startsWith('/app/activity')) return 'activity'
  if (pathname.startsWith('/app/analytics')) return 'analytics'
  if (pathname.startsWith('/app/assistant')) return 'assistant'
  if (pathname.startsWith('/app/sandbox')) return 'sandbox'
  if (pathname.startsWith('/app/settings')) return 'settings'
  if (pathname.startsWith('/app/notifications')) return 'notifications'
  return 'home'
}

function initialsFromName(fullName: string) {
  const parts = fullName.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return 'AW'
  return parts.slice(0, 2).map((part) => part[0]?.toUpperCase() ?? '').join('')
}

export function DashboardPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const { walletType: walletTypeParam, paymentId: paymentIdParam } = useParams<{ walletType?: string; paymentId?: string }>()
  const selectedEnvelope = isWalletType(walletTypeParam) ? walletTypeParam : null
  const activeView = viewFromPath(location.pathname)

  const navItems: NavigationItem[] = [
    { id: 'home', label: t.navHome, icon: House, path: '/dashboard' },
    { id: 'activity', label: t.navActivity, icon: Activity, path: '/app/activity' },
    { id: 'envelopes', label: t.navEnvelopes, icon: Wallet, path: '/app/envelopes' },
    { id: 'rules', label: t.navRules, icon: SlidersHorizontal, path: '/app/rules' },
    { id: 'analytics', label: t.navAnalytics, icon: BarChart3, path: '/app/analytics' },
    { id: 'assistant', label: t.navAssistant, icon: Sparkles, path: '/app/assistant' },
    { id: 'sandbox', label: t.navSandbox, icon: FlaskConical, path: '/app/sandbox', demo: true },
    { id: 'settings', label: t.navSettings, icon: Settings, path: '/app/settings' },
  ]
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [popover, setPopover] = useState<HeaderPopover>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [online, setOnline] = useState(() => navigator.onLine)

  const [bankIdInput, setBankIdInput] = useState('')
  const [bankLinkError, setBankLinkError] = useState<string | null>(null)
  const [linkingBank, setLinkingBank] = useState(false)

  const [toast, setToast] = useState<string | null>(null)
  const nextLoadSignal = useRequestSignal()
  const statusPopoverRef = useRef<HTMLDivElement>(null)
  const notificationsPopoverRef = useRef<HTMLDivElement>(null)
  const profilePopoverRef = useRef<HTMLDivElement>(null)
  const moreMenuRef = useRef<HTMLDivElement>(null)
  const moreTriggerRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!popover) return

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node | null
      if (!target) return

      if (popover === 'more') {
        if (moreMenuRef.current?.contains(target) || moreTriggerRef.current?.contains(target)) {
          return
        }
      } else if (popover === 'status') {
        if (statusPopoverRef.current?.contains(target)) {
          return
        }
      } else if (popover === 'notifications') {
        if (notificationsPopoverRef.current?.contains(target)) {
          return
        }
      } else if (popover === 'profile') {
        if (profilePopoverRef.current?.contains(target)) {
          return
        }
      }

      setPopover(null)
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setPopover(null)
      }
    }

    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [popover])

  const payments = newestPaymentsFirst(data?.transactions ?? [])
  const userId = data?.account.id ?? ''
  const alertsEnabled = usePaymentAlerts(userId)
  const { unread: rawUnread, readIds, markRead } = usePaymentNotifications(userId, payments)
  const unreadCount = alertsEnabled ? rawUnread : 0

  const handleUnauthorized = () => {
    localStorage.removeItem('autowallet_token')
    const returnTo = safeReturnPath(`${location.pathname}${location.search}`)
    navigate(`/session-ended?redirect=${encodeURIComponent(returnTo)}`, { replace: true })
  }

  const loadDashboard = async (showSpinner = false) => {
    const token = localStorage.getItem('autowallet_token')
    if (!token) {
      const returnTo = safeReturnPath(`${location.pathname}${location.search}`)
      navigate(`/login?redirect=${encodeURIComponent(returnTo)}`, { replace: true })
      return
    }

    const signal = nextLoadSignal()
    if (showSpinner) setLoading(true)
    else setRefreshing(true)
    setError(null)

    try {
      const nextData = await fetchDashboardData(token, signal)
      if (signal.aborted) return
      setData(nextData)
    } catch (reason) {
      if (signal.aborted || (reason instanceof DOMException && reason.name === 'AbortError')) return
      if (reason instanceof DashboardApiError && reason.status === 401) {
        handleUnauthorized()
        return
      }
      setError(reason instanceof Error ? reason.message : 'Could not load your dashboard.')
    } finally {
      if (!signal.aborted) {
        setLoading(false)
        setRefreshing(false)
      }
    }
  }

  const initialLoad = useEffectEvent(() => {
    void loadDashboard(true)
  })

  useEffect(() => {
    queueMicrotask(() => {
      initialLoad()
    })
  }, [])

  useEffect(() => {
    const goOnline = () => setOnline(true)
    const goOffline = () => setOnline(false)
    window.addEventListener('online', goOnline)
    window.addEventListener('offline', goOffline)
    return () => {
      window.removeEventListener('online', goOnline)
      window.removeEventListener('offline', goOffline)
    }
  }, [])

  useEffect(() => {
    if (!toast) return
    const timer = window.setTimeout(() => setToast(null), 5000)
    return () => window.clearTimeout(timer)
  }, [toast])

  const liveUpdatesEnabled = Boolean(data?.account.bank_account_id) && !import.meta.env.VITEST
  const liveStatus = usePaymentLiveUpdates({
    userId,
    enabled: liveUpdatesEnabled,
    onRefresh: () => loadDashboard(false),
    onSessionEnded: handleUnauthorized,
  })

  const handleLinkBankAccount = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const token = localStorage.getItem('autowallet_token')
    if (!token) {
      handleUnauthorized()
      return
    }
    const trimmed = bankIdInput.trim()
    if (trimmed.length < 3 || trimmed.length > 34) {
      setBankLinkError('Enter a bank account ID between 3 and 34 characters.')
      return
    }

    setLinkingBank(true)
    setBankLinkError(null)
    try {
      await linkBankAccount(token, trimmed)
      setBankIdInput('')
      await loadDashboard(true)
      setToast('Your bank account ID is linked.')
    } catch (reason) {
      if (reason instanceof DashboardApiError && reason.status === 401) {
        handleUnauthorized()
        return
      }
      setBankLinkError(reason instanceof Error ? reason.message : 'Could not link this bank account ID.')
    } finally {
      setLinkingBank(false)
    }
  }

  const handleUpdateRule = async (ruleId: string, updates: Partial<RuleDraft>) => {
    const token = localStorage.getItem('autowallet_token')
    if (!token) {
      handleUnauthorized()
      return
    }
    try {
      await updateRule(token, ruleId, updates)
      await loadDashboard(false)
    } catch (reason) {
      if (reason instanceof DashboardApiError && reason.status === 401) {
        handleUnauthorized()
        return
      }
      throw reason
    }
  }

  const handleSpendMoney = async (payload: {
    wallet_type: WalletType
    amount: number
    reference?: string
  }) => {
    const token = localStorage.getItem('autowallet_token')
    if (!token) {
      handleUnauthorized()
      return
    }
    try {
      await spendFromEnvelope(token, payload)
      await loadDashboard(false)
      setToast(
        `Recorded ${money.format(payload.amount)} MAD spending from ${envelopeMeta[payload.wallet_type].name}.`,
      )
    } catch (reason) {
      if (reason instanceof DashboardApiError && reason.status === 401) {
        handleUnauthorized()
        return
      }
      throw reason
    }
  }

  const openView = (view: ActiveView) => {
    setPopover(null)
    const target = navItems.find((item) => item.id === view)?.path
    if (target) {
      navigate(target)
      window.scrollTo({ top: 0, behavior: 'instant' })
      return
    }
    if (view === 'notifications') {
      navigate('/app/notifications')
      window.scrollTo({ top: 0, behavior: 'instant' })
    }
  }

  const openEnvelope = (type: WalletType) => {
    setPopover(null)
    navigate(`/app/envelopes/${type}`)
  }

  const openPayment = (payment: DashboardTransaction) => {
    setPopover(null)
    navigate(`/app/activity/${encodeURIComponent(payment.id)}`)
  }

  const signOut = () => {
    localStorage.removeItem('autowallet_token')
    sessionStorage.removeItem('autowallet_signup_draft')
    clearTwoFactorCredentials()
    clearRecoveryCodes()
    navigate('/login', { replace: true })
  }

  const linkAccountFromSettings = async (bankAccountId: string) => {
    const token = localStorage.getItem('autowallet_token')
    if (!token) {
      handleUnauthorized()
      return
    }
    try {
      await linkBankAccount(token, bankAccountId)
      await loadDashboard(false)
    } catch (reason) {
      if (reason instanceof DashboardApiError && reason.status === 401) {
        handleUnauthorized()
        return
      }
      throw reason
    }
  }

  const selectedPayment = paymentIdParam
    ? payments.find((payment) => payment.id === paymentIdParam) ?? null
    : null
  const primaryNav = navItems.filter((item) => !item.demo)
  const demoNav = navItems.filter((item) => item.demo)
  const activeLabel = navItems.find((item) => item.id === activeView)?.label ?? t.navNotifications
  const actionDisabled = !online || loading || !data?.account.bank_account_id
  const liveReady = online && liveStatus !== 'reconnecting'
  const statusLabel = !online ? t.statusOff : liveStatus === 'reconnecting' ? t.statusChecking : t.statusLive

  return (
    <div className={`dashboard-shell ${sidebarCollapsed ? 'dashboard-shell--collapsed' : ''} dashboard-shell--${activeView}`}>
      <aside className="dashboard-sidebar" aria-label="Main navigation">
        <button type="button" onClick={() => openView('home')} className="dashboard-logo">
          <img src="/AW.svg" alt="" />
          <span>AutoWallet</span>
        </button>

        <nav className="mt-7 flex flex-col gap-1" aria-label="Main navigation">
          {primaryNav.map((item) => {
            const Icon = item.icon
            const active = activeView === item.id
            return (
              <button
                key={item.id}
                type="button"
                title={item.label}
                onClick={() => openView(item.id)}
                className={`dashboard-nav-item ${active ? 'dashboard-nav-item--active' : ''}`}
              >
                <Icon className="h-[18px] w-[18px] shrink-0" />
                <span>{item.label}</span>
              </button>
            )
          })}

          <div className="dashboard-sidebar-demo">
            <p>{t.navDemo}</p>
            {demoNav.map((item) => {
              const Icon = item.icon
              const active = activeView === item.id
              return (
                <button
                  key={item.id}
                  type="button"
                  title={item.label}
                  onClick={() => openView(item.id)}
                  className={`dashboard-nav-item ${active ? 'dashboard-nav-item--active' : ''}`}
                >
                  <Icon className="h-[18px] w-[18px] shrink-0" />
                  <span>{item.label}</span>
                </button>
              )
            })}
          </div>
        </nav>

        <button
          type="button"
          onClick={() => setSidebarCollapsed((value) => !value)}
          className="dashboard-sidebar-collapse"
          aria-label={sidebarCollapsed ? t.navExpand : t.navCollapse}
        >
          <PanelLeft className="h-4 w-4 shrink-0" />
          <span>{t.navCollapse}</span>
        </button>
      </aside>

      <div className="dashboard-main-wrap">
        <header className="dashboard-header">
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => openView('home')} className="dashboard-mobile-logo">
              <img src="/AW.svg" alt="" />
              <span>AutoWallet</span>
            </button>
            {activeView === 'envelopes' && selectedEnvelope ? (
              <nav className="dashboard-header-breadcrumb" aria-label="Breadcrumb">
                <button type="button" onClick={() => openView('envelopes')}>{t.navEnvelopes}</button>
                <ChevronRight className="h-4 w-4" aria-hidden="true" />
                <strong>{envelopeMeta[selectedEnvelope].name}</strong>
              </nav>
            ) : activeView === 'activity' && paymentIdParam ? (
              <nav className="dashboard-header-breadcrumb" aria-label="Breadcrumb">
                <button type="button" onClick={() => openView('activity')}>{t.navActivity}</button>
                <ChevronRight className="h-4 w-4" aria-hidden="true" />
                <strong>{selectedPayment?.reference ?? paymentIdParam}</strong>
              </nav>
            ) : (
              <strong className="dashboard-header-title">{activeLabel}</strong>
            )}
          </div>

          <div className="dashboard-header-tools">
            <LanguageSelector compact />
            <div className="relative" ref={statusPopoverRef}>
              <button
                type="button"
                onClick={() => setPopover((current) => current === 'status' ? null : 'status')}
                className={`dashboard-live ${!online ? 'dashboard-live--offline' : !liveReady ? 'dashboard-live--checking' : ''}`}
                aria-expanded={popover === 'status'}
              >
                <span className={`h-2 w-2 rounded-full ${!online ? 'bg-[#C84A4A]' : liveReady ? 'bg-[#22A05A]' : 'bg-[#8B98AA]'}`} />
                <span className="dashboard-status-full">{statusLabel}</span>
                <span className="dashboard-status-short">{!online ? t.statusOff : t.statusLive}</span>
              </button>
              {popover === 'status' && (
                <div className="dashboard-popover end-0">
                  <strong>{!online ? t.statusOffline : liveStatus === 'reconnecting' ? t.statusReconnecting : t.statusConnected}</strong>
                  <p>
                    {!online
                      ? t.statusOfflineDesc
                      : liveStatus === 'reconnecting'
                        ? t.statusReconnectingDesc
                        : t.statusConnectedDesc}
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setPopover(null)
                      void loadDashboard(false)
                    }}
                    className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-[#5A64B4] hover:underline"
                  >
                    <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
                    {t.refreshNow}
                  </button>
                </div>
              )}
            </div>

            <div className="relative" ref={notificationsPopoverRef}>
              <button
                type="button"
                onClick={() => {
                  if (window.matchMedia('(max-width: 767px)').matches) openView('notifications')
                  else setPopover((current) => current === 'notifications' ? null : 'notifications')
                }}
                className="dashboard-icon-button notification-bell"
                aria-label={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : 'Notifications'}
                aria-expanded={popover === 'notifications'}
              >
                <Bell className="h-4 w-4" />
                {unreadCount > 0 && <span className="notification-count">{unreadCount > 9 ? '9+' : unreadCount}</span>}
              </button>
              {popover === 'notifications' && (
                <div className="notifications-popover">
                  <NotificationsView
                    payments={payments}
                    readIds={readIds}
                    unread={unreadCount}
                    onRead={markRead}
                    onSelect={openPayment}
                    onBack={() => openView('notifications')}
                    onSettings={() => openView('settings')}
                    enabled={alertsEnabled}
                    compact
                  />
                </div>
              )}
            </div>

            <div className="relative" ref={profilePopoverRef}>
              <button
                type="button"
                onClick={() => setPopover((current) => current === 'profile' ? null : 'profile')}
                className="dashboard-profile"
                aria-label={t.accountMenu}
                aria-expanded={popover === 'profile'}
              >
                <span>{initialsFromName(data?.account.full_name ?? 'AutoWallet')}</span>
                <ChevronDown className="h-3.5 w-3.5" />
              </button>
              {popover === 'profile' && (
                <div className="dashboard-popover end-0 w-64">
                  <strong className="block truncate">{data?.account.full_name ?? t.userFallback}</strong>
                  <p className="truncate">{data?.account.email ?? ''}</p>
                  <button
                    type="button"
                    onClick={() => openView('settings')}
                    className="mt-3 flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-start text-xs font-semibold text-[var(--aw-ink)] hover:bg-[var(--aw-bg)]"
                  >
                    <Settings className="h-3.5 w-3.5" />
                    {t.navSettings}
                  </button>
                  <button
                    type="button"
                    onClick={signOut}
                    className="mt-1 flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-start text-xs font-semibold text-[#B42318] hover:bg-[#FEF3F2]"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    {t.logOut}
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {!online && (
          <div className="dashboard-offline" role="status">
            <WifiOff className="h-4 w-4 shrink-0" />
            <span>You&apos;re offline — showing the last loaded data.</span>
          </div>
        )}

        <main className={`dashboard-main ${activeView === 'assistant' ? 'dashboard-main--assistant' : ''}`}>
          {loading ? (
            activeView === 'envelopes' && !selectedEnvelope ? <EnvelopesSkeleton /> :
            activeView === 'activity' && !paymentIdParam ? <ActivitySkeleton /> :
            <LoadingHome />
          ) : error ? (
            <section className="dashboard-empty-payments">
              <h1 className="text-lg font-extrabold text-[#1E293B]">Couldn&apos;t load your dashboard</h1>
              <p className="mt-2 max-w-md text-xs leading-relaxed text-[#66758B]">{error}</p>
              <button type="button" onClick={() => void loadDashboard(true)} className="dashboard-primary-button mt-5">
                Try again
              </button>
            </section>
          ) : data && !data.account.bank_account_id ? (
            <section className="dashboard-subview">
              <div className="rounded-2xl border border-[#DCE3EB] bg-white p-7 shadow-2xs">
                <h1 className="text-xl font-extrabold text-[#1E293B]">Link your bank account ID</h1>
                <p className="mt-2 text-sm leading-relaxed text-[#64738B]">
                  You signed in as <strong>{data.account.email}</strong>. Add your bank account ID so AutoWallet can create your envelopes and split incoming payments.
                </p>
                <form onSubmit={(event) => void handleLinkBankAccount(event)} className="mt-5 max-w-md space-y-3" noValidate>
                  <label className="block text-xs font-bold text-[#334155]" htmlFor="dashboard-bank-account-id">
                    Bank account ID
                  </label>
                  <input
                    id="dashboard-bank-account-id"
                    value={bankIdInput}
                    onChange={(event) => {
                      setBankIdInput(event.target.value)
                      setBankLinkError(null)
                    }}
                    placeholder="MA00001234567890"
                    className="dashboard-input"
                  />
                  {bankLinkError && <p className="text-xs font-medium text-[#C2413B]" role="alert">{bankLinkError}</p>}
                  <button type="submit" disabled={linkingBank || !online} className="dashboard-primary-button">
                    {linkingBank ? 'Linking...' : 'Link account'}
                  </button>
                </form>
              </div>
            </section>
          ) : data && activeView === 'home' ? (
            <HomeView
              data={data}
              onNavigate={(view) => openView(view)}
              onSelectPayment={openPayment}
            />
          ) : data && activeView === 'envelopes' && selectedEnvelope ? (
            <EnvelopeDetailView
              type={selectedEnvelope}
              data={data}
              onBack={() => openView('envelopes')}
              onOpenRules={() => openView('rules')}
              onOpenPayment={openPayment}
              actionDisabled={actionDisabled}
              onSpendMoney={handleSpendMoney}
              onAskAssistant={(question) => navigate('/app/assistant', { state: { question } })}
            />
          ) : data && activeView === 'envelopes' ? (
            <EnvelopesView
              wallets={data.wallets}
              rules={data.rules}
              onSelect={openEnvelope}
              busy={refreshing || !online}
            />
          ) : data && activeView === 'rules' ? (
            <RulesView
              data={data}
              busy={refreshing || !online}
              onUpdateRule={handleUpdateRule}
            />
          ) : data && activeView === 'activity' && paymentIdParam ? (
            <PaymentDetailView
              paymentId={paymentIdParam}
              data={data}
              onBack={() => openView('activity')}
              onRefresh={() => void loadDashboard(false)}
            />
          ) : data && activeView === 'activity' ? (
            <ActivityView
              payments={payments}
              search={searchQuery}
              onSearchChange={setSearchQuery}
              onSelect={openPayment}
            />
          ) : data && activeView === 'analytics' ? (
            <AnalyticsView
              data={data}
              onAsk={(question) => navigate('/app/assistant', { state: { question } })}
              onRules={() => openView('rules')}
              onRefresh={() => loadDashboard(false)}
              onSessionEnded={handleUnauthorized}
            />
          ) : data && activeView === 'assistant' ? (
            <AssistantView
              data={data}
              online={online}
              onSessionEnded={handleUnauthorized}
            />
          ) : data && activeView === 'sandbox' ? (
            <SandboxView data={data} />
          ) : data && activeView === 'settings' ? (
            <SettingsView
              account={data.account}
              online={online}
              onLinkAccount={linkAccountFromSettings}
              onRefresh={() => loadDashboard(false)}
              onSignOut={signOut}
              onSessionEnded={handleUnauthorized}
              onDeleted={signOut}
            />
          ) : data && activeView === 'notifications' ? (
            <NotificationsView
              payments={payments}
              readIds={readIds}
              unread={unreadCount}
              onRead={markRead}
              onSelect={openPayment}
              onBack={() => openView('home')}
              onSettings={() => openView('settings')}
              enabled={alertsEnabled}
            />
          ) : null}

          <footer className="dashboard-footer">
            <Link to="/privacy">{t.legalPrivacyTitle}</Link>
            <Link to="/terms">{t.legalTermsTitle}</Link>
            <span>AutoWallet · All amounts in MAD</span>
          </footer>
        </main>
      </div>

      <nav className="dashboard-mobile-nav" aria-label="Mobile navigation">
        {(['home', 'activity', 'envelopes', 'rules'] as const).map((id) => {
          const item = navItems.find((entry) => entry.id === id)!
          const Icon = item.icon
          const active = activeView === id
          return (
            <button key={id} type="button" onClick={() => openView(id)} className={active ? 'is-active' : ''}>
              <Icon className="h-5 w-5" />
              <span>{item.label}</span>
            </button>
          )
        })}
        <button
          ref={moreTriggerRef}
          type="button"
          onClick={() => setPopover((current) => current === 'more' ? null : 'more')}
          className={(['analytics', 'assistant', 'sandbox', 'settings', 'notifications'] as const).includes(activeView as 'analytics') ? 'is-active' : ''}
          aria-expanded={popover === 'more'}
        >
          <MoreHorizontal className="h-5 w-5" />
          <span>More</span>
        </button>
      </nav>

      {popover === 'more' && (
        <div className="dashboard-more-menu" ref={moreMenuRef} role="menu" aria-label="More options">
          <button type="button" role="menuitem" className={activeView === 'analytics' ? 'font-semibold text-[#5963b6]' : ''} onClick={() => openView('analytics')}>{t.navAnalytics}</button>
          <button type="button" role="menuitem" className={activeView === 'assistant' ? 'font-semibold text-[#5963b6]' : ''} onClick={() => openView('assistant')}>{t.navAssistant}</button>
          <button type="button" role="menuitem" className={activeView === 'sandbox' ? 'font-semibold text-[#5963b6]' : ''} onClick={() => openView('sandbox')}>{t.navSandbox}</button>
          <button type="button" role="menuitem" className={activeView === 'notifications' ? 'font-semibold text-[#5963b6]' : ''} onClick={() => openView('notifications')}>{t.navNotifications}</button>
          <button type="button" role="menuitem" className={activeView === 'settings' ? 'font-semibold text-[#5963b6]' : ''} onClick={() => openView('settings')}>{t.navSettings}</button>
        </div>
      )}

      {toast && (
        <div className="dashboard-toast" role="status">
          <span>{toast}</span>
          <button type="button" onClick={() => setToast(null)} aria-label="Dismiss notification">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  )
}
