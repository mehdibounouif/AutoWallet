import { useCallback, useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  AlertCircle, ArrowDownLeft, ArrowRight, BarChart3, Bell, Check, ChevronDown, ChevronRight,
  Clock3, FlaskConical, LayoutDashboard, Link2, ListOrdered,
  LogOut, Mail, Menu, MessageSquareText, PanelLeftClose, Plus,
  Search, Settings2, ShieldCheck, ShoppingBag, X,
} from 'lucide-react'
import type { ComponentType } from 'react'
import { DashboardApiError, fetchDashboard } from './dashboardApi'
import type { DashboardData, DashboardTransaction, WalletType } from './dashboardApi'
import { previewSplit } from './dashboardSplit'
import type { SplitAmounts } from './dashboardSplit'
import { DashboardSplitRibbon } from './DashboardSplitRibbon'
import { EnvelopesSkeleton, EnvelopesView } from './EnvelopesView'
import { EnvelopeDetailView } from './EnvelopeDetailView'
import { envelopeDescription, envelopeMeta, envelopeOrder, money } from './envelopeDisplay'
import './dashboard.css'

const previewAmount = 8500
type View = 'home' | 'envelopes' | 'envelope-detail' | 'rules' | 'activity'
const nav: { view: Exclude<View, 'envelope-detail'>; label: string; icon: ComponentType<{ className?: string }> }[] = [
  { view: 'home', label: 'Home', icon: LayoutDashboard },
  { view: 'envelopes', label: 'Envelopes', icon: Mail },
  { view: 'rules', label: 'Rules', icon: ListOrdered },
  { view: 'activity', label: 'Activity', icon: Clock3 },
]

function date(value?: string) {
  return value ? new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(new Date(value)) : ''
}

function EnvelopeRow({ type, data }: { type: WalletType; data: DashboardData }) {
  const item = envelopeMeta[type]
  const Icon = item.icon
  const balance = data.wallets.find((wallet) => wallet.wallet_type === type)?.balance
  const target = data.rules.find((rule) => rule.is_active && rule.target_wallet === type && rule.condition_field === `${type}_balance` && rule.condition_value !== null && rule.condition_value > 0)?.condition_value ?? null
  const progress = target && balance !== undefined ? Math.max(0, Math.min(100, balance / target * 100)) : 0
  return <article className="dashboard-envelope-row">
    <span className="dashboard-envelope-icon" style={{ backgroundColor: item.tint, color: item.color }}><Icon className="h-5 w-5" aria-hidden="true" /></span>
    <div className="min-w-0 flex-1">
      <div className="flex items-baseline justify-between gap-2"><h3 className="text-sm font-bold text-[#243044]">{item.name}</h3><strong className={`shrink-0 text-sm tabular-nums ${type === 'main' ? 'text-[#65748C]' : 'text-[#243044]'}`}>{balance === undefined ? '—' : money.format(balance)}</strong></div>
      <p className="mt-1 text-xs leading-5 text-[#66758D]">{envelopeDescription(type, data.rules)}</p>
      {target !== null && balance !== undefined && <div className="mt-3 max-w-[320px]"><div className="h-1 overflow-hidden rounded-full bg-[#E5EAF0]" role="progressbar" aria-label={`${item.name} target progress`} aria-valuenow={Math.round(progress)} aria-valuemin={0} aria-valuemax={100}><span className="block h-full rounded-full" style={{ width: `${progress}%`, backgroundColor: item.color }} /></div><p className="mt-2 text-[11px] text-[#66758D]">{type === 'rent' && progress >= 100 ? <span className="inline-flex items-center gap-1"><Check className="h-3.5 w-3.5 text-[#188442]" aria-hidden="true" />Target met</span> : `${Math.round(progress)}% of the ${money.format(target)} ${type === 'savings' ? 'cap' : 'target'}`}</p></div>}
    </div>
  </article>
}

function Status({ status }: { status: DashboardTransaction['status'] }) {
  const Icon = status === 'processed' ? Check : status === 'pending' ? Clock3 : AlertCircle
  return <span className={`dashboard-payment-status dashboard-payment-status--${status}`}><Icon className="h-3.5 w-3.5" aria-hidden="true" />{status === 'processed' ? 'Processed' : status === 'pending' ? 'Pending' : 'Failed'}</span>
}

function hasCompleteSplit(payment: DashboardTransaction) {
  if (!payment.allocations || payment.amount <= 0) return false
  const allocated = Object.values(payment.allocations).reduce<number>((sum, value) => sum + (value ?? 0), 0)
  return Math.abs(allocated - payment.amount) < 0.02
}

function SplitBar({ payment }: { payment: DashboardTransaction }) {
  if (payment.status === 'pending') return <span className="text-xs text-[#7A879B]">Splitting...</span>
  if (!hasCompleteSplit(payment)) return <span className="text-xs text-[#96A2B2]">Breakdown unavailable</span>
  const types: WalletType[] = ['rent', 'tax', 'savings', 'free', 'main']
  return <span className="flex h-2 w-full max-w-[172px] overflow-hidden rounded-full bg-[#E4E9EF]" role="img" aria-label="Payment split by envelope">{types.map((type) => (payment.allocations?.[type] ?? 0) > 0 ? <span key={type} style={{ width: `${((payment.allocations?.[type] ?? 0) / payment.amount) * 100}%`, backgroundColor: type === 'main' ? '#8A95D2' : type === 'free' ? '#EDA100' : envelopeMeta[type].color }} /> : null)}</span>
}

function Payments({ payments, onSelect, limit }: { payments: DashboardTransaction[]; onSelect: (payment: DashboardTransaction) => void; limit?: number }) {
  const visiblePayments = limit === undefined ? payments : payments.slice(0, limit)
  if (payments.length === 0) return <div className="dashboard-empty-payments">
    <div className="flex items-center text-[#7EA4C1]" aria-hidden="true"><span className="mr-2 w-10 border-t-2 border-dashed border-[#9FB1C0]" /><Mail className="h-8 w-8 fill-[#D7E7F3]" /><Mail className="-ml-1 h-8 w-8 fill-[#D7E7F3]" /><Mail className="-ml-1 h-8 w-8 fill-[#D7E7F3]" /></div>
    <h3 className="mt-5 text-base font-bold text-[#273247]">No payments yet</h3>
    <p className="mt-2 max-w-xs text-sm leading-6 text-[#728198]">When a client pays your linked account, it shows up here, already split.</p>
  </div>
  return <>
    <div className="hidden overflow-x-auto md:block"><table className="dashboard-payments-table"><thead><tr><th>Reference</th><th>Received ↓</th><th className="text-right">Amount (MAD)</th><th>Split</th><th>Status</th><th><span className="sr-only">Open</span></th></tr></thead><tbody>{visiblePayments.map((payment) => <tr key={payment.id}><td className="font-mono font-semibold text-[#263246]">{payment.reference}</td><td className="text-[#708099]">{date(payment.created_at) || '—'}</td><td className="text-right font-semibold tabular-nums text-[#263246]">{money.format(payment.amount)}</td><td className="w-[32%]"><SplitBar payment={payment} /></td><td><Status status={payment.status} /></td><td><button type="button" onClick={() => onSelect(payment)} aria-label={`View ${payment.reference}`} className="text-[#8090A7] hover:text-[#5963B6]"><ChevronRight className="h-4 w-4" /></button></td></tr>)}</tbody></table></div>
    <div className="divide-y divide-[#DCE3EB] md:hidden">{visiblePayments.map((payment) => <button type="button" key={payment.id} onClick={() => onSelect(payment)} className="block w-full py-3.5 text-left"><span className="flex items-center justify-between gap-2"><span className="truncate font-mono text-xs font-semibold text-[#263246]">{payment.reference}</span><strong className="text-sm tabular-nums text-[#263246]">{money.format(payment.amount)}</strong></span><span className="mt-2 flex items-center gap-2"><span className="shrink-0 text-xs text-[#7A879B]">{date(payment.created_at) || '—'}</span><span className="min-w-0 flex-1"><SplitBar payment={payment} /></span><Status status={payment.status} /></span></button>)}</div>
  </>
}

function LoadingHome() {
  return <div className="animate-pulse space-y-8" role="status" aria-label="Loading dashboard"><div className="h-8 w-60 rounded-lg bg-[#E6EBF1]" /><div className="grid gap-8 md:grid-cols-2"><div className="space-y-4"><div className="h-5 w-32 rounded bg-[#E6EBF1]" /><div className="h-14 w-56 rounded bg-[#E6EBF1]" /><div className="h-4 w-72 rounded bg-[#E6EBF1]" /></div><div className="space-y-4">{[1, 2, 3, 4].map((i) => <div key={i} className="h-16 rounded bg-[#E6EBF1]" />)}</div></div><div className="h-64 rounded bg-[#E6EBF1]" /><div className="h-56 rounded-xl bg-white" /><span className="sr-only">Loading dashboard data</span></div>
}

export function DashboardPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const controller = useRef<AbortController | null>(null)
  const lastSnapshot = useRef<DashboardData | null>(null)
  const searchRef = useRef<HTMLInputElement | null>(null)
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [subView, setSubView] = useState<Exclude<View, 'envelopes' | 'envelope-detail'>>('home')
  const detailSegment = location.pathname.match(/^\/app\/envelopes\/([^/]+)$/)?.[1]
  const detailType = detailSegment && detailSegment in envelopeMeta ? detailSegment as WalletType : null
  const view: View = detailSegment ? 'envelope-detail' : location.pathname === '/app/envelopes' ? 'envelopes' : subView
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [moreOpen, setMoreOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [notificationOpen, setNotificationOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [recordOpen, setRecordOpen] = useState(false)
  const [simulateOpen, setSimulateOpen] = useState(false)
  const [selectedPayment, setSelectedPayment] = useState<DashboardTransaction | null>(null)
  const [reference, setReference] = useState('')
  const [recordAmount, setRecordAmount] = useState('')
  const [simulateAmount, setSimulateAmount] = useState('8500')
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const [newPayment, setNewPayment] = useState<DashboardTransaction | null>(null)
  const [bankAccountId, setBankAccountId] = useState('')
  const [linking, setLinking] = useState(false)
  const [linkError, setLinkError] = useState<string | null>(null)
  const [online, setOnline] = useState(() => navigator.onLine)

  const signOut = useCallback(() => { localStorage.removeItem('autowallet_token'); navigate('/login', { replace: true }) }, [navigate])
  const loadDashboard = useCallback(async () => {
    controller.current?.abort()
    const next = new AbortController()
    controller.current = next
    const token = localStorage.getItem('autowallet_token')
    if (!token) { navigate('/login?redirect=%2Fdashboard', { replace: true }); return }
    setLoading(true)
    setError(null)
    try {
      const result = await fetchDashboard(token, next.signal)
      if (!next.signal.aborted) {
        const latestPayment = result.transactions[0]
        if (latestPayment && lastSnapshot.current && !lastSnapshot.current.transactions.some((payment) => payment.id === latestPayment.id)) {
          setToast(null)
          setNewPayment(latestPayment)
        }
        lastSnapshot.current = result
        setData(result)
      }
    } catch (reason) {
      if (next.signal.aborted) return
      if (reason instanceof DashboardApiError && reason.status === 401) { localStorage.removeItem('autowallet_token'); navigate('/session-ended?reason=expired', { replace: true }); return }
      setError('We could not load your dashboard. Check that the backend and authorization service are running, then try again.')
    } finally { if (!next.signal.aborted) setLoading(false) }
  }, [navigate])

  useEffect(() => { let active = true; queueMicrotask(() => { if (active) void loadDashboard() }); return () => { active = false; controller.current?.abort() } }, [loadDashboard])
  useEffect(() => {
    const update = () => {
      setOnline(navigator.onLine)
      if (navigator.onLine) void loadDashboard()
    }
    const refreshOnReturn = () => {
      if (document.visibilityState === 'visible' && navigator.onLine) void loadDashboard()
    }
    const shortcut = (event: KeyboardEvent) => { if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); searchRef.current?.focus() } }
    window.addEventListener('online', update); window.addEventListener('offline', update); window.addEventListener('keydown', shortcut)
    document.addEventListener('visibilitychange', refreshOnReturn)
    return () => { window.removeEventListener('online', update); window.removeEventListener('offline', update); window.removeEventListener('keydown', shortcut); document.removeEventListener('visibilitychange', refreshOnReturn) }
  }, [loadDashboard])

  const handleLink = async (event: FormEvent) => {
    event.preventDefault()
    const id = bankAccountId.trim()
    if (id.length < 3 || id.length > 50 || linking) { setLinkError('Enter a bank account ID between 3 and 50 characters.'); return }
    const token = localStorage.getItem('autowallet_token')
    if (!token) { signOut(); return }
    setLinking(true); setLinkError(null)
    try {
      const response = await fetch('/api/auth/link-bank-account', { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ bank_account_id: id }) })
      if (response.status === 401) { signOut(); return }
      if (!response.ok) { const payload = await response.json().catch(() => ({})); setLinkError(typeof payload.detail === 'string' ? payload.detail : 'Could not link this account. Please try again.'); return }
      setBankAccountId(''); await loadDashboard()
    } catch { setLinkError('Could not reach the backend. Please try again.') } finally { setLinking(false) }
  }

  const handleRecord = async (event: FormEvent) => {
    event.preventDefault()
    const amount = Number(recordAmount)
    if (!reference.trim() || !Number.isFinite(amount) || amount <= 0 || saving) { setFormError('Enter a payment reference and an amount greater than zero.'); return }
    const token = localStorage.getItem('autowallet_token')
    if (!token) { signOut(); return }
    setSaving(true); setFormError(null)
    try {
      const response = await fetch('/api/transactions/', { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ reference: reference.trim(), amount }) })
      if (response.status === 401) { signOut(); return }
      if (!response.ok) { const payload = await response.json().catch(() => ({})); setFormError(typeof payload.detail === 'string' ? payload.detail : 'Could not record this payment.'); return }
      setRecordOpen(false); setToast(`Payment ${reference.trim()} recorded.`); setReference(''); setRecordAmount(''); await loadDashboard()
    } catch { setFormError('Could not reach the backend. Please try again.') } finally { setSaving(false) }
  }

  const chooseView = (next: Exclude<View, 'envelope-detail'>) => {
    if (next !== 'envelopes') setSubView(next)
    if (next === 'envelopes' && location.pathname !== '/app/envelopes') navigate('/app/envelopes')
    else if (next !== 'envelopes' && location.pathname.startsWith('/app/envelopes')) navigate('/dashboard')
    setMoreOpen(false)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
  const openEnvelope = (type: WalletType) => {
    navigate(`/app/envelopes/${type}`)
    setMoreOpen(false)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
  const user = data?.user
  const firstName = user?.full_name.trim().split(/\s+/)[0] || 'there'
  const initials = user?.full_name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0].toUpperCase()).join('') || 'AW'
  const payments = (data?.transactions ?? []).filter((item) => item.reference.toLowerCase().includes(search.trim().toLowerCase()))
  const latest = data?.transactions[0]
  const wallets = data?.wallets ?? []
  const freeBalance = wallets.find((item) => item.wallet_type === 'free')?.balance ?? 0
  const setAside = wallets.filter((item) => item.wallet_type === 'rent' || item.wallet_type === 'tax' || item.wallet_type === 'savings').reduce((sum, item) => sum + item.balance, 0)
  const totalBalance = wallets.reduce((sum, item) => sum + item.balance, 0)
  const historical = data?.transactions.find((item) => item.status === 'processed' && hasCompleteSplit(item))
  const ribbonAllocations: SplitAmounts = historical ? { main: 0, rent: 0, tax: 0, savings: 0, free: 0, ...historical.allocations } : previewSplit(previewAmount, data?.rules ?? [], wallets)
  const activeRules = data?.rules.filter((item) => item.is_active).length ?? 0
  const simulation = Number(simulateAmount)
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  return <div className={`dashboard-shell ${sidebarCollapsed ? 'dashboard-shell--collapsed' : ''}`}>
    <aside className="dashboard-sidebar"><button type="button" onClick={() => chooseView('home')} className="dashboard-logo" aria-label="AutoWallet Home"><img src="/AW.svg" alt="" /><span>AutoWallet</span></button><nav className="mt-10 space-y-1" aria-label="Main navigation">{nav.map(({ view: itemView, label, icon: Icon }) => <button key={itemView} type="button" onClick={() => chooseView(itemView)} className={`dashboard-nav-item ${(view === itemView || (view === 'envelope-detail' && itemView === 'envelopes')) ? 'dashboard-nav-item--active' : ''}`} title={label}><Icon className="h-[18px] w-[18px] shrink-0" aria-hidden="true" /><span>{label}</span></button>)}<button type="button" onClick={() => setToast('Analytics is coming soon.')} className="dashboard-nav-item" title="Analytics"><BarChart3 className="h-[18px] w-[18px] shrink-0" /><span>Analytics</span></button><button type="button" onClick={() => setToast('Assistant is coming soon.')} className="dashboard-nav-item" title="Assistant"><MessageSquareText className="h-[18px] w-[18px] shrink-0" /><span>Assistant</span></button><button type="button" onClick={() => setToast('Settings is coming soon.')} className="dashboard-nav-item" title="Settings"><Settings2 className="h-[18px] w-[18px] shrink-0" /><span>Settings</span></button></nav><div className="dashboard-sidebar-demo"><p>DEMO</p><button type="button" onClick={() => setSimulateOpen(true)} className="dashboard-nav-item" title="Sandbox"><FlaskConical className="h-[18px] w-[18px] shrink-0" /><span>Sandbox</span></button></div><button type="button" onClick={() => setSidebarCollapsed((value) => !value)} className="dashboard-sidebar-collapse" title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}><PanelLeftClose className="h-4 w-4" /><span>Collapse sidebar</span></button></aside>
    <div className="dashboard-main-wrap"><header className="dashboard-header"><button type="button" onClick={() => chooseView('home')} className="dashboard-mobile-logo" aria-label="AutoWallet Home"><img src="/AW.svg" alt="" /><span>AutoWallet</span></button><div className="dashboard-header-title">{view === 'envelope-detail' && detailType ? <span className="dashboard-header-breadcrumb"><button type="button" onClick={() => chooseView('envelopes')}>Envelopes</button><ChevronRight className="h-4 w-4" aria-hidden="true" /><strong>{envelopeMeta[detailType].name}</strong></span> : <strong>{view === 'home' ? 'Home' : view === 'envelopes' ? 'Envelopes' : view === 'rules' ? 'Rules' : view === 'activity' ? 'Activity' : 'Envelope'}</strong>}</div><div className="dashboard-header-tools"><span className={`dashboard-live ${online ? '' : 'dashboard-live--offline'}`}><span className="h-1.5 w-1.5 rounded-full bg-current" />{online ? 'Online' : 'Offline'}</span><label className="dashboard-search"><Search className="h-4 w-4" aria-hidden="true" /><input ref={searchRef} value={search} onChange={(event) => { setSearch(event.target.value); if (event.target.value) chooseView('activity') }} placeholder="Search by reference" aria-label="Search by reference" /><kbd>⌘K</kbd></label><button type="button" onClick={() => { chooseView('activity'); searchRef.current?.focus() }} className="dashboard-mobile-tool" aria-label="Search payments"><Search className="h-5 w-5" /></button><div className="relative"><button type="button" onClick={() => setNotificationOpen((value) => !value)} className="dashboard-icon-button" aria-label="Notifications"><Bell className="h-5 w-5" /></button>{notificationOpen && <div className="dashboard-popover right-0"><strong>Notifications</strong><p>No new notifications.</p></div>}</div><div className="relative"><button type="button" onClick={() => setProfileOpen((value) => !value)} className="dashboard-profile" aria-label="Account menu"><span>{initials}</span><ChevronDown className="h-4 w-4" /></button>{profileOpen && <div className="dashboard-popover right-0"><strong className="block truncate">{user?.full_name || 'AutoWallet'}</strong><p className="truncate">{user?.email}</p><button type="button" onClick={signOut} className="mt-3 flex items-center gap-2 text-sm font-semibold text-[#5963B6]"><LogOut className="h-4 w-4" />Sign out</button></div>}</div></div></header>
      {!online && <div role="status" className="dashboard-offline"><AlertCircle className="h-4 w-4" />You're offline. We'll refresh when you're back.</div>}
      <main className="dashboard-main">{loading && !data ? ((view === 'envelopes' || view === 'envelope-detail') ? <EnvelopesSkeleton /> : <LoadingHome />) : !data ? <section className="mx-auto mt-16 max-w-md rounded-xl bg-white p-8 text-center shadow-sm"><AlertCircle className="mx-auto h-9 w-9 text-[#C44D4D]" /><h1 className="mt-4 text-xl font-bold">Dashboard unavailable</h1><p role="alert" className="mt-2 text-sm text-[#66758D]">{error}</p><button type="button" onClick={() => void loadDashboard()} className="dashboard-primary-button mt-5">Try again</button></section> : <>{error && <div role="alert" className="mb-5 flex items-center justify-between gap-3 rounded-lg bg-[#FFF0EF] px-4 py-3 text-sm text-[#A33B3B]"><span>{error}</span><button type="button" onClick={() => void loadDashboard()} className="font-semibold underline">Retry</button></div>}{!user?.bank_account_id ? <section className="mx-auto mt-10 max-w-xl rounded-xl bg-white p-7 shadow-sm"><Link2 className="h-9 w-9 text-[#5A64B4]" /><h1 className="mt-5 text-2xl font-bold">Link your bank account ID</h1><p className="mt-2 text-sm leading-6 text-[#65748C]">Add the account ID that receives your payments to see envelopes, transactions, and rules here. This records the ID with your profile; it does not connect to your bank or move money.</p><form onSubmit={(event) => void handleLink(event)} className="mt-5 flex flex-wrap items-end gap-3"><label className="min-w-[200px] flex-1 text-sm font-semibold">Bank account ID<input value={bankAccountId} onChange={(event) => setBankAccountId(event.target.value)} minLength={3} maxLength={50} required className="dashboard-input mt-2" placeholder="Enter your account ID" /></label><button type="submit" disabled={linking} className="dashboard-primary-button h-11">{linking ? 'Linking…' : 'Link account'}</button></form>{linkError && <p role="alert" className="mt-3 text-sm text-[#B53235]">{linkError}</p>}</section> : <>
        {view !== 'envelopes' && view !== 'envelope-detail' && <div className="dashboard-intro"><div><h1>{greeting}, {firstName}</h1><p>{new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'short', day: 'numeric' }).format(new Date())}</p></div><div className="dashboard-actions"><span>Payments</span><button type="button" onClick={() => setSimulateOpen(true)} className="dashboard-secondary-button"><FlaskConical className="h-4 w-4" />Simulate payment</button><button type="button" onClick={() => setRecordOpen(true)} disabled={!online} className="dashboard-primary-button"><Plus className="h-4 w-4" />Record payment</button></div></div>}
        {view === 'home' ? <><div className="dashboard-hero"><section aria-labelledby="free-heading" className="dashboard-free"><div className="flex items-center gap-2"><span className="dashboard-envelope-icon !h-7 !w-7" style={{ backgroundColor: envelopeMeta.free.tint, color: envelopeMeta.free.color }}><ShoppingBag className="h-4 w-4" /></span><h2 id="free-heading" className="text-sm font-bold text-[#29364A]">Free to spend</h2></div><p className="dashboard-free-amount">{money.format(freeBalance)} <span>MAD</span></p><p className="mt-4 text-sm text-[#62718A]">Set aside {money.format(setAside)} in Rent, Tax and Savings</p><p className="mt-1 text-sm text-[#8290A5]">Total {money.format(totalBalance)}</p><p className="mt-5 flex items-start gap-2 text-sm text-[#66758D]"><span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[#178449]" />{latest ? <>+{money.format(latest.amount)} from {latest.reference}{latest.created_at ? ` · ${date(latest.created_at)}` : ''}</> : 'No payments yet. Your first payment will appear here.'}</p><div className="mt-5 text-sm text-[#66758D]"><p className="flex items-start gap-2"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />{activeRules > 0 ? `${activeRules} active rules are ready to split payments.` : 'Set up rules to organize your payments.'}</p><button type="button" onClick={() => chooseView('rules')} className="ml-6 mt-1 inline-flex items-center gap-1 font-semibold text-[#5963B6]">View rules <ArrowRight className="h-4 w-4" /></button></div></section>{data.transactions.length === 0 ? <div className="dashboard-empty-hero"><Payments payments={[]} onSelect={setSelectedPayment} /></div> : <section aria-labelledby="set-aside-heading" className="dashboard-set-aside"><h2 id="set-aside-heading" className="mb-2 text-sm font-bold text-[#29364A]">Set aside</h2>{envelopeOrder.map((type) => <EnvelopeRow key={type} type={type} data={data} />)}</section>}</div>
          <section className="dashboard-split-section" aria-labelledby="split-heading"><div className="dashboard-section-heading"><h2 id="split-heading">{historical ? 'Last payment split' : 'What your next payment will do'}</h2>{historical?.created_at && <span>{date(historical.created_at)}</span>}<button type="button" onClick={() => historical ? setSelectedPayment(historical) : setSimulateOpen(true)}>{historical ? 'View payment' : 'Try an amount'} <ArrowRight className="h-4 w-4" /></button></div><DashboardSplitRibbon amount={historical?.amount ?? previewAmount} allocations={ribbonAllocations} reference={historical?.reference} preview={!historical} />{!historical && <p className="dashboard-preview-note">Preview with {money.format(previewAmount)} MAD using your current rules. Your balances will not change.</p>}</section>
          {data.transactions.length > 0 && <section className="dashboard-recent" aria-labelledby="recent-heading"><div className="dashboard-section-heading"><h2 id="recent-heading">Recent payments</h2><button type="button" onClick={() => chooseView('activity')}>View all <ArrowRight className="h-4 w-4" /></button></div><Payments payments={payments} onSelect={setSelectedPayment} limit={5} /></section>}</> : view === 'envelopes' ? <EnvelopesView data={data} onMoveMoney={() => setToast('Moving money is not available yet.')} onOpen={openEnvelope} /> : view === 'envelope-detail' ? (detailType ? <EnvelopeDetailView type={detailType} data={data} onBack={() => chooseView('envelopes')} onViewRules={() => chooseView('rules')} onSelectPayment={setSelectedPayment} onUnavailable={(action) => setToast(`${action} is not available yet.`)} /> : <section className="dashboard-subview"><h1>Envelope not found</h1><button type="button" onClick={() => chooseView('envelopes')} className="dashboard-primary-button mt-4">Back to Envelopes</button></section>) : view === 'rules' ? <section className="dashboard-subview"><h2>Your saved rules</h2><p className="mb-7 text-sm text-[#6B7A92]">Rules run in priority order whenever a payment is recorded.</p>{data.rules.length === 0 ? <p>No rules are saved for this account yet.</p> : <div className="dashboard-rule-list">{data.rules.map((rule) => { const item = envelopeMeta[rule.target_wallet]; const Icon = item.icon; return <div key={rule.id} className="dashboard-rule-row"><span className="dashboard-envelope-icon" style={{ backgroundColor: item.tint, color: item.color }}><Icon className="h-5 w-5" /></span><div className="min-w-0 flex-1"><strong>{rule.name}</strong><p>{envelopeDescription(rule.target_wallet, data.rules)}</p></div><span className={rule.is_active ? 'text-[#188442]' : 'text-[#77869B]'}>{rule.is_active ? 'Active' : 'Paused'}</span></div> })}</div>}</section> : <section className="dashboard-subview"><h2>Payment activity</h2><p className="mb-7 text-sm text-[#6B7A92]">{search ? `Results for “${search}”` : 'Payments recorded for your linked account.'}</p><Payments payments={payments} onSelect={setSelectedPayment} /></section>}
        <footer className="dashboard-footer"><Link to="/privacy">Privacy</Link><Link to="/terms">Terms</Link><span>AutoWallet</span></footer>
      </>}</> }</main>
    </div>
    {view !== 'envelopes' && view !== 'envelope-detail' && <button type="button" onClick={() => setRecordOpen(true)} disabled={!online || !user?.bank_account_id} className="dashboard-mobile-record"><Plus className="h-4 w-4" />Record payment</button>}<nav className="dashboard-mobile-nav" aria-label="Mobile navigation"><button type="button" onClick={() => chooseView('home')} className={view === 'home' ? 'is-active' : ''}><LayoutDashboard /><span>Home</span></button><button type="button" onClick={() => chooseView('rules')} className={view === 'rules' ? 'is-active' : ''}><ListOrdered /><span>Rules</span></button><button type="button" onClick={() => chooseView('activity')} className={view === 'activity' ? 'is-active' : ''}><Clock3 /><span>Activity</span></button><button type="button" onClick={() => setToast('Assistant is coming soon.')}><MessageSquareText /><span>Assistant</span></button><button type="button" onClick={() => setMoreOpen((value) => !value)} className={view === 'envelopes' || view === 'envelope-detail' ? 'is-active' : ''}><Menu /><span>More</span></button></nav>{moreOpen && <div className="dashboard-more-menu"><button type="button" onClick={() => chooseView('envelopes')}>Envelopes</button><button type="button" onClick={() => setSimulateOpen(true)}>Sandbox</button><button type="button" onClick={signOut}>Sign out</button></div>}
    {newPayment && <div role="status" className="dashboard-toast dashboard-toast--payment"><ArrowDownLeft className="h-4 w-4 shrink-0 text-[#5963B6]" aria-hidden="true" /><div><strong>+{money.format(newPayment.amount)} MAD from {newPayment.reference}</strong><p>Your envelope balances have been refreshed.</p><button type="button" onClick={() => { setSelectedPayment(newPayment); setNewPayment(null) }}>{newPayment.allocations ? 'View split' : 'View payment'}</button></div><button type="button" onClick={() => setNewPayment(null)} aria-label="Dismiss payment notification"><X className="h-4 w-4" /></button></div>}
    {toast && <div role="status" className="dashboard-toast"><Check className="h-4 w-4 text-[#19854A]" /><span>{toast}</span><button type="button" onClick={() => setToast(null)} aria-label="Dismiss notification"><X className="h-4 w-4" /></button></div>}
    {recordOpen && <div className="dashboard-modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setRecordOpen(false) }}><section role="dialog" aria-modal="true" aria-labelledby="record-title" className="dashboard-modal"><button type="button" onClick={() => setRecordOpen(false)} className="dashboard-modal-close" aria-label="Close"><X className="h-5 w-5" /></button><h2 id="record-title">Record a payment</h2><p>Record a payment for your linked account. This updates your envelope balances using your saved rules.</p><form onSubmit={(event) => void handleRecord(event)} className="mt-6 space-y-4"><label className="block text-sm font-semibold">Reference<input className="dashboard-input mt-2" value={reference} onChange={(event) => setReference(event.target.value)} maxLength={100} required placeholder="INV-2026-001" /></label><label className="block text-sm font-semibold">Amount (MAD)<input className="dashboard-input mt-2" type="number" min="0.01" step="0.01" value={recordAmount} onChange={(event) => setRecordAmount(event.target.value)} required placeholder="2400.00" /></label>{formError && <p role="alert" className="text-sm text-[#B53235]">{formError}</p>}<button type="submit" disabled={saving || !online} className="dashboard-primary-button w-full justify-center">{saving ? 'Recording…' : 'Record payment'}</button></form></section></div>}
    {simulateOpen && <div className="dashboard-modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setSimulateOpen(false) }}><section role="dialog" aria-modal="true" aria-labelledby="simulate-title" className="dashboard-modal dashboard-modal--wide"><button type="button" onClick={() => setSimulateOpen(false)} className="dashboard-modal-close" aria-label="Close"><X className="h-5 w-5" /></button><h2 id="simulate-title">Simulate a payment</h2><p>Preview how your current rules would split a payment. Your balances will not change.</p><label className="mt-6 block max-w-xs text-sm font-semibold">Amount (MAD)<input className="dashboard-input mt-2" type="number" min="0.01" step="0.01" value={simulateAmount} onChange={(event) => setSimulateAmount(event.target.value)} /></label>{Number.isFinite(simulation) && simulation > 0 && <DashboardSplitRibbon amount={simulation} allocations={previewSplit(simulation, data?.rules ?? [], wallets)} preview />}</section></div>}
    {selectedPayment && <div className="dashboard-modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelectedPayment(null) }}><section role="dialog" aria-modal="true" aria-labelledby="payment-title" className="dashboard-modal"><button type="button" onClick={() => setSelectedPayment(null)} className="dashboard-modal-close" aria-label="Close"><X className="h-5 w-5" /></button><h2 id="payment-title">{selectedPayment.reference}</h2><p className="mt-2 text-2xl font-bold text-[#263246]">{money.format(selectedPayment.amount)} <span className="text-sm text-[#708099]">MAD</span></p><div className="mt-4"><Status status={selectedPayment.status} /></div>{selectedPayment.created_at && <p className="mt-4">Received {date(selectedPayment.created_at)}</p>}{selectedPayment.allocations ? <div className="mt-6 space-y-2">{Object.entries(selectedPayment.allocations).map(([type, amount]) => <p key={type} className="flex justify-between text-sm"><span>{envelopeMeta[type as WalletType]?.name ?? type}</span><strong>{money.format(amount)} MAD</strong></p>)}</div> : <p className="mt-6 text-sm text-[#6B7A92]">The backend does not provide a split breakdown for this payment.</p>}</section></div>}
  </div>
}
