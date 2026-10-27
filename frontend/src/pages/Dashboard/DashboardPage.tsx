import { useEffect, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import type { DashboardTransaction, RuleDraft, WalletType } from './dashboardApi'
import { DashboardApiError, linkBankAccount, spendFromEnvelope, updateRule } from './dashboardApi'
import { useDashboardData } from './useDashboardData'
import { useOnlineStatus } from '../../hooks/useOnlineStatus'
import { usePaymentLiveUpdates } from './usePaymentLiveUpdates'
import { usePaymentNotifications } from './usePaymentNotifications'
import { usePaymentAlerts } from '../Settings/settingsAlerts'
import { viewFromPath } from '../../components/layout/navigation'
import type { DashboardView } from '../../components/layout/navigation'
import { navigationItems, notificationsItem } from '../../components/layout/navigation'
import { AppShell } from '../../components/layout/AppShell'
import { DashboardHeaderTools } from './DashboardHeaderTools'
import { LinkBankAccountPrompt } from './LinkBankAccountPrompt'
import { HomeView } from './HomeView'
import { LoadingHome } from './home/LoadingHome'
import { ActivitySkeleton, ActivityView } from './ActivityView'
import { AnalyticsView } from './AnalyticsView'
import { AssistantView } from './AssistantView'
import { EnvelopeDetailView } from './EnvelopeDetailView'
import { EnvelopesView } from './EnvelopesView'
import { EnvelopesSkeleton } from './envelopes/EnvelopesSkeleton'
import { NotificationsView } from './NotificationsView'
import { PaymentDetailView } from './PaymentDetailView'
import { RulesView } from './RulesView'
import { SandboxView } from './SandboxView'
import { SettingsView } from '../Settings/SettingsView'
import { envelopeMeta, money, walletOrder } from './envelopeDisplay'
import { newestPaymentsFirst } from './paymentUtils'
import { clearTwoFactorCredentials } from '../../auth/pendingCredentials'
import { clearRecoveryCodes } from '../../auth/recoveryCodes'
import { clearSignupDraft } from '../../auth/signupDraft'
import { clearToken, getToken } from '../../auth/session'
import { safeReturnPath } from '../../auth/returnPath'
import { Button } from '../../components/ui/Button'
import { EmptyState } from '../../components/ui/EmptyState'
import { useTranslation } from '../../i18n'

function isWalletType(value: string | undefined): value is WalletType {
  return Boolean(value && walletOrder.includes(value as WalletType))
}

export function DashboardPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const { walletType: walletTypeParam, paymentId: paymentIdParam } = useParams<{ walletType?: string; paymentId?: string }>()
  const selectedEnvelope = isWalletType(walletTypeParam) ? walletTypeParam : null
  const activeView = viewFromPath(location.pathname)
  const online = useOnlineStatus()
  const [toast, setToast] = useState<string | null>(null)

  const returnTo = () => safeReturnPath(`${location.pathname}${location.search}`)

  const handleUnauthorized = () => {
    clearToken()
    navigate(`/session-ended?redirect=${encodeURIComponent(returnTo())}`, { replace: true })
  }

  const handleMissingToken = () => {
    navigate(`/login?redirect=${encodeURIComponent(returnTo())}`, { replace: true })
  }

  const { data, loading, refreshing, error, loadDashboard } = useDashboardData({
    onUnauthorized: handleUnauthorized,
    onMissingToken: handleMissingToken,
  })

  const payments = newestPaymentsFirst(data?.transactions ?? [])
  const userId = data?.account.id ?? ''
  const alertsEnabled = usePaymentAlerts(userId)
  const { unread, readIds, markRead } = usePaymentNotifications(userId, payments)
  const unreadCount = alertsEnabled ? unread : 0

  const liveUpdatesEnabled = Boolean(data?.account.bank_account_id) && !import.meta.env.VITEST
  const liveStatus = usePaymentLiveUpdates({
    userId,
    enabled: liveUpdatesEnabled,
    onRefresh: () => loadDashboard(false),
    onSessionEnded: handleUnauthorized,
  })

  useEffect(() => {
    if (!toast) return
    const timer = window.setTimeout(() => setToast(null), 5000)
    return () => window.clearTimeout(timer)
  }, [toast])

  const openView = (view: DashboardView) => {
    const item = [...navigationItems, notificationsItem].find((entry) => entry.id === view)
    if (!item) return
    navigate(item.path)
    window.scrollTo({ top: 0, behavior: 'instant' })
  }

  const openEnvelope = (type: WalletType) => {
    navigate(`/app/envelopes/${type}`)
  }

  const openPayment = (payment: DashboardTransaction) => {
    navigate(`/app/activity/${encodeURIComponent(payment.id)}`)
  }

  const signOut = () => {
    clearToken()
    clearSignupDraft()
    clearTwoFactorCredentials()
    clearRecoveryCodes()
    navigate('/login', { replace: true })
  }

  const withToken = async (action: (token: string) => Promise<void>) => {
    const token = getToken()
    if (!token) {
      handleUnauthorized()
      return
    }
    try {
      await action(token)
    } catch (reason) {
      if (reason instanceof DashboardApiError && reason.status === 401) {
        handleUnauthorized()
        return
      }
      throw reason
    }
  }

  const handleLinkBankAccount = (bankAccountId: string) =>
    withToken(async (token) => {
      await linkBankAccount(token, bankAccountId)
      await loadDashboard(true)
      setToast('Your bank account ID is linked.')
    })

  const handleUpdateRule = (ruleId: string, updates: Partial<RuleDraft>) =>
    withToken(async (token) => {
      await updateRule(token, ruleId, updates)
      await loadDashboard(false)
    })

  const handleSpendMoney = (payload: { wallet_type: WalletType; amount: number; reference?: string }) =>
    withToken(async (token) => {
      await spendFromEnvelope(token, payload)
      await loadDashboard(false)
      setToast(`Recorded ${money.format(payload.amount)} MAD spending from ${envelopeMeta[payload.wallet_type].name}.`)
    })

  const linkAccountFromSettings = (bankAccountId: string) =>
    withToken(async (token) => {
      await linkBankAccount(token, bankAccountId)
      await loadDashboard(false)
    })

  const selectedPayment = paymentIdParam
    ? payments.find((payment) => payment.id === paymentIdParam) ?? null
    : null
  const activeNavItem = [...navigationItems, notificationsItem].find((item) => item.id === activeView)

  const headerStart = activeView === 'envelopes' && selectedEnvelope ? (
    <nav className="flex min-w-0 items-center gap-1.5 text-sm" aria-label="Breadcrumb">
      <button type="button" onClick={() => openView('envelopes')} className="font-semibold text-accent hover:underline">
        {t.navEnvelopes}
      </button>
      <ChevronRight className="size-4 text-muted" aria-hidden="true" />
      <strong className="truncate text-body">{envelopeMeta[selectedEnvelope].name}</strong>
    </nav>
  ) : activeView === 'activity' && paymentIdParam ? (
    <nav className="flex min-w-0 items-center gap-1.5 text-sm" aria-label="Breadcrumb">
      <button type="button" onClick={() => openView('activity')} className="font-semibold text-accent hover:underline">
        {t.navActivity}
      </button>
      <ChevronRight className="size-4 text-muted" aria-hidden="true" />
      <strong className="truncate text-body">{selectedPayment?.reference ?? paymentIdParam}</strong>
    </nav>
  ) : (
    <strong className="hidden text-[17px] font-extrabold text-ink md:block">
      {activeNavItem ? t[activeNavItem.labelKey] : t.navNotifications}
    </strong>
  )

  const actionDisabled = !online || loading || !data?.account.bank_account_id

  const renderView = () => {
    if (loading) {
      if (activeView === 'envelopes' && !selectedEnvelope) return <EnvelopesSkeleton />
      if (activeView === 'activity' && !paymentIdParam) return <ActivitySkeleton />
      return <LoadingHome />
    }

    if (error) {
      return (
        <EmptyState
          title="Couldn't load your dashboard"
          description={error}
          action={<Button onClick={() => void loadDashboard(true)}>Try again</Button>}
        />
      )
    }

    if (!data) return null
    if (!data.account.bank_account_id) {
      return <LinkBankAccountPrompt email={data.account.email} online={online} onLink={handleLinkBankAccount} />
    }

    switch (activeView) {
      case 'home':
        return <HomeView data={data} onNavigate={openView} onSelectPayment={openPayment} />
      case 'envelopes':
        return selectedEnvelope ? (
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
        ) : (
          <EnvelopesView wallets={data.wallets} rules={data.rules} onSelect={openEnvelope} busy={refreshing || !online} />
        )
      case 'rules':
        return <RulesView data={data} busy={refreshing || !online} onUpdateRule={handleUpdateRule} />
      case 'activity':
        return paymentIdParam ? (
          <PaymentDetailView paymentId={paymentIdParam} data={data} onBack={() => openView('activity')} onRefresh={() => void loadDashboard(false)} />
        ) : (
          <ActivityView payments={payments} onSelect={openPayment} />
        )
      case 'analytics':
        return (
          <AnalyticsView
            data={data}
            onAsk={(question) => navigate('/app/assistant', { state: { question } })}
            onRules={() => openView('rules')}
            onRefresh={() => loadDashboard(false)}
            onSessionEnded={handleUnauthorized}
          />
        )
      case 'assistant':
        return <AssistantView data={data} online={online} onSessionEnded={handleUnauthorized} />
      case 'sandbox':
        return <SandboxView data={data} />
      case 'settings':
        return (
          <SettingsView
            account={data.account}
            online={online}
            onLinkAccount={linkAccountFromSettings}
            onRefresh={() => loadDashboard(false)}
            onSignOut={signOut}
            onSessionEnded={handleUnauthorized}
            onDeleted={signOut}
          />
        )
      case 'notifications':
        return (
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
        )
      default:
        return null
    }
  }

  return (
    <AppShell
      view={activeView}
      onNavigate={openView}
      headerStart={headerStart}
      headerTools={
        <DashboardHeaderTools
          account={data?.account ?? null}
          online={online}
          liveStatus={liveStatus}
          refreshing={refreshing}
          unreadCount={unreadCount}
          payments={payments}
          readIds={readIds}
          alertsEnabled={alertsEnabled}
          onRefresh={() => void loadDashboard(false)}
          onRead={markRead}
          onSelectPayment={openPayment}
          onOpenNotifications={() => openView('notifications')}
          onOpenSettings={() => openView('settings')}
          onSignOut={signOut}
        />
      }
      online={online}
      toast={toast}
      onDismissToast={() => setToast(null)}
    >
      {renderView()}
    </AppShell>
  )
}
