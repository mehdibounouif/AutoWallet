import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import {
  ArrowLeft,
  Bell,
  Check,
  ChevronRight,
  Copy,
  Eye,
  EyeOff,
  Globe,
  KeyRound,
  LogOut,
  Plus,
  Shield,
  Sparkles,
  Trash2,
  User,
} from 'lucide-react'
import type { DashboardAccount } from '../Dashboard/dashboardApi'
import {
  SettingsApiError,
  createApiKey,
  fetchApiKeys,
  revokeApiKey,
} from '../../api/settingsApi'
import type { ApiKeyItem } from '../../api/settingsApi'
import {
  getStoredAiConfig,
  saveStoredAiConfig,
} from '../../api/assistantApi'
import type { AiConfig } from '../../api/assistantApi'
import { PrivacySettings } from './PrivacySettings'
import { SecuritySettings } from './SecuritySettings'
import {
  savePaymentAlerts,
  usePaymentAlerts,
} from './settingsAlerts'
import { getTwoFactorStatus, setTwoFactorStatus } from '../../auth/recoveryCodes'
import { useTranslation } from '../../i18n'
import './settings.css'

export type SettingsSection = 'account' | 'security' | 'privacy' | 'notifications' | 'developer'

interface SettingsViewProps {
  account: DashboardAccount
  online: boolean
  onLinkAccount: (bankAccountId: string) => Promise<void>
  onRefresh: () => Promise<void>
  onSignOut: () => void
  onSessionEnded: () => void
  onDeleted: () => void
}

function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join('') || 'AW'
}

export function SettingsView({
  account,
  online,
  onLinkAccount,
  onRefresh,
  onSignOut,
  onSessionEnded,
  onDeleted,
}: SettingsViewProps) {
  const { t } = useTranslation()
  const location = useLocation()
  const initialSection = (location.state as { section?: SettingsSection } | null)?.section || 'account'
  const [section, setSection] = useState<SettingsSection>(initialSection)
  const [mobileIndex, setMobileIndex] = useState(initialSection === 'account')

  const sections: { id: SettingsSection; label: string; icon: typeof User }[] = [
    { id: 'account', label: t.tabAccount, icon: User },
    { id: 'security', label: t.tabSecurity, icon: Shield },
    { id: 'privacy', label: t.tabPrivacy, icon: Globe },
    { id: 'notifications', label: t.tabNotifications, icon: Bell },
    { id: 'developer', label: t.tabDeveloper, icon: KeyRound },
  ]

  const [bankDraft, setBankDraft] = useState('')
  const [bankError, setBankError] = useState<string | null>(null)
  const [bankNotice, setBankNotice] = useState<string | null>(null)
  const [linking, setLinking] = useState(false)
  const [twoFactorOverride, setTwoFactorOverride] = useState<boolean | null>(() => getTwoFactorStatus(account.email))
  const twoFactorHint = twoFactorOverride ?? account.is_2fa_enabled ?? getTwoFactorStatus(account.email) ?? null
  const setTwoFactorHint = (value: boolean | null) => {
    setTwoFactorOverride(value)
    if (value !== null) {
      setTwoFactorStatus(account.email, value)
    }
  }
  const [signsInWith, setSignsInWith] = useState<string | null>(
    account.has_password === false ? 'google' : 'password',
  )
  const [role, setRole] = useState<string | null>(account.role ?? null)
  const paymentAlertsEnabled = usePaymentAlerts(account.id)
  const [savedNotice, setSavedNotice] = useState<string | null>(null)
  const [copiedCurl, setCopiedCurl] = useState(false)

  // Personal API keys state
  const [apiKeys, setApiKeys] = useState<ApiKeyItem[]>([])
  const [keysLoading, setKeysLoading] = useState(false)
  const [keyNameDraft, setKeyNameDraft] = useState('')
  const [keyCreating, setKeyCreating] = useState(false)
  const [keyError, setKeyError] = useState<string | null>(null)
  const [newlyCreatedKey, setNewlyCreatedKey] = useState<string | null>(null)
  const [copiedNewKey, setCopiedNewKey] = useState(false)

  // AI Assistant API key state
  const [aiConfig, setAiConfig] = useState<AiConfig | null>(() => getStoredAiConfig())
  const [aiKeyDraft, setAiKeyDraft] = useState(() => getStoredAiConfig()?.apiKey || '')
  const [aiModelDraft, setAiModelDraft] = useState(() => getStoredAiConfig()?.model || '')
  const [aiBaseUrlDraft, setAiBaseUrlDraft] = useState(() => getStoredAiConfig()?.baseUrl || '')
  const [showAiKey, setShowAiKey] = useState(false)
  const [aiNotice, setAiNotice] = useState<string | null>(null)

  const handleSaveAiConfig = () => {
    if (!aiKeyDraft.trim()) {
      saveStoredAiConfig(null)
      setAiConfig(null)
      setAiNotice('AI API key removed.')
      setTimeout(() => setAiNotice(null), 3000)
      return
    }
    const newConfig: AiConfig = {
      apiKey: aiKeyDraft.trim(),
      model: aiModelDraft.trim() || undefined,
      baseUrl: aiBaseUrlDraft.trim() || undefined,
    }
    saveStoredAiConfig(newConfig)
    setAiConfig(newConfig)
    setAiNotice('AI assistant key saved successfully! The Assistant can now answer your questions.')
    setTimeout(() => setAiNotice(null), 4000)
  }

  const handleRemoveAiConfig = () => {
    saveStoredAiConfig(null)
    setAiConfig(null)
    setAiKeyDraft('')
    setAiModelDraft('')
    setAiBaseUrlDraft('')
    setAiNotice('AI API key removed.')
    setTimeout(() => setAiNotice(null), 3000)
  }

  useEffect(() => {
    if (section !== 'developer' || !online) return
    const controller = new AbortController()
    queueMicrotask(() => {
      if (controller.signal.aborted) return
      setKeysLoading(true)
      fetchApiKeys(controller.signal)
        .then((items) => {
          if (!controller.signal.aborted) setApiKeys(items)
        })
        .catch((err) => {
          if (controller.signal.aborted) return
          if (err instanceof SettingsApiError && err.status === 401) onSessionEnded()
        })
        .finally(() => {
          if (!controller.signal.aborted) setKeysLoading(false)
        })
    })
    return () => controller.abort()
  }, [section, online, onSessionEnded])

  const openSection = (next: SettingsSection) => {
    setSection(next)
    setMobileIndex(false)
    setSavedNotice(null)
  }

  const submitBankLink = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const trimmed = bankDraft.trim()
    if (!/^\d{3,34}$/.test(trimmed)) {
      setBankError('Enter 3 to 34 digits. Letters and spaces are not accepted.')
      return
    }
    setLinking(true)
    setBankError(null)
    setBankNotice(null)
    try {
      await onLinkAccount(trimmed)
      setBankDraft('')
      setBankNotice('Your bank account ID is linked.')
    } catch (reason) {
      setBankError(reason instanceof Error ? reason.message : 'Could not link this bank account ID.')
    } finally {
      setLinking(false)
    }
  }

  const updatePaymentAlerts = (enabled: boolean) => {
    savePaymentAlerts(account.id, enabled)
    setSavedNotice('Saved in this browser')
  }

  const handleCreateKey = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const trimmed = keyNameDraft.trim()
    if (!trimmed) {
      setKeyError('Enter a descriptive name for your API key.')
      return
    }
    setKeyCreating(true)
    setKeyError(null)
    setNewlyCreatedKey(null)
    try {
      const created = await createApiKey(trimmed)
      setApiKeys((prev) => [created, ...prev])
      setKeyNameDraft('')
      if (created.secret_key) {
        setNewlyCreatedKey(created.secret_key)
        setCopiedNewKey(false)
      }
    } catch (err) {
      if (err instanceof SettingsApiError && err.status === 401) {
        onSessionEnded()
        return
      }
      setKeyError(err instanceof Error ? err.message : 'Could not create API key.')
    } finally {
      setKeyCreating(false)
    }
  }

  const handleRevokeKey = async (id: string) => {
    try {
      await revokeApiKey(id)
      setApiKeys((prev) => prev.filter((item) => item.id !== id))
    } catch (err) {
      if (err instanceof SettingsApiError && err.status === 401) {
        onSessionEnded()
        return
      }
      setKeyError(err instanceof Error ? err.message : 'Could not revoke API key.')
    }
  }

  const curlExample = `curl -X POST ${window.location.origin}/api/transactions/ \\
  -H "Authorization: Bearer <your_access_or_api_key>" \\
  -H "Content-Type: application/json" \\
  -d '{"reference":"INV-2026-048","amount":8500}'`

  const copyCurl = async () => {
    try {
      await navigator.clipboard.writeText(curlExample)
      setCopiedCurl(true)
    } catch {
      setCopiedCurl(false)
    }
  }

  const activeSection = sections.find((item) => item.id === section) ?? sections[0]

  return (
    <div className={`workspace-page settings-page ${mobileIndex ? 'settings-page--index' : 'settings-page--section'}`}>
      <header className="workspace-heading settings-heading">
        <div>
          <h1>{t.settingsHeading}</h1>
          <p>{t.settingsSubheading}</p>
        </div>
      </header>

      <div className="settings-mobile-index">
        <button type="button" className="workspace-card settings-account-link" onClick={() => openSection('account')}>
          <span className="settings-identity">
            <span className="settings-avatar">{initials(account.full_name)}</span>
            <span>
              <strong className="settings-identity-title">{account.full_name}</strong>
              <span>{account.email}</span>
            </span>
          </span>
          <ChevronRight size={16} />
        </button>
      </div>

      <div className="settings-layout">
        <nav className="settings-section-nav" aria-label="Settings sections">
          {sections.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              className={`settings-section-link ${section === id ? 'settings-section-link--active' : ''}`}
              onClick={() => openSection(id)}
            >
              <Icon size={16} />
              <span>{label}</span>
              <ChevronRight size={14} className="settings-section-chevron" />
            </button>
          ))}
        </nav>

        <div className="settings-content">
          <button type="button" className="workspace-back settings-mobile-back" onClick={() => setMobileIndex(true)}>
            <ArrowLeft size={14} />
            Settings
          </button>
          <h2 className="settings-mobile-title">{activeSection.label}</h2>

          {section === 'account' && (
            <>
              <section className="workspace-card settings-card settings-profile">
                <h2>Profile</h2>
                <p>Your identity details for this AutoWallet account.</p>
                <div className="settings-identity">
                  <span className="settings-avatar">{initials(account.full_name)}</span>
                  <div>
                    <strong className="settings-identity-title">
                      {account.full_name}
                      {role && <span className="workspace-tag">{role}</span>}
                    </strong>
                    <span>{account.email}</span>
                  </div>
                </div>
              </section>

              <section className="workspace-card settings-card">
                <h2>Connected bank account</h2>
                <p>Incoming payments for this bank account ID are split by your active rules.</p>
                {bankNotice && <p className="workspace-note" role="status">{bankNotice}</p>}
                {account.bank_account_id ? (
                  <div className="settings-form">
                    <label>
                      Bank account ID
                      <input className="dashboard-input settings-readonly" readOnly value={account.bank_account_id} />
                      <span className="workspace-note">This account ID is linked and ready to receive payments.</span>
                    </label>
                  </div>
                ) : (
                  <form className="settings-form" onSubmit={(event) => void submitBankLink(event)} noValidate>
                    <label htmlFor="settings-bank-id">
                      Bank account ID
                      <input
                        id="settings-bank-id"
                        className="dashboard-input"
                        inputMode="numeric"
                        value={bankDraft}
                        onChange={(event) => { setBankDraft(event.target.value); setBankError(null) }}
                        placeholder="00100000042"
                        aria-invalid={Boolean(bankError)}
                      />
                      {bankError && <span className="workspace-field-error" role="alert">{bankError}</span>}
                    </label>
                    <button type="submit" className="dashboard-primary-button" disabled={!online || linking}>
                      {linking ? 'Linking…' : 'Link bank account'}
                    </button>
                  </form>
                )}
              </section>
            </>
          )}

          {section === 'security' && (
            <SecuritySettings
              email={account.email}
              online={online}
              twoFactorHint={twoFactorHint}
              signsInWith={signsInWith}
              onSessionEnded={onSessionEnded}
              onTwoFactorChanged={(isEnabled) => {
                setTwoFactorHint(isEnabled)
                void onRefresh()
              }}
            />
          )}

          {section === 'privacy' && (
            <PrivacySettings
              email={account.email}
              online={online}
              onSecurityInfo={(info) => {
                if (typeof info.two_factor_enabled === 'boolean') {
                  setTwoFactorHint(info.two_factor_enabled)
                  setTwoFactorStatus(account.email, info.two_factor_enabled)
                }
                if (info.signs_in_with) setSignsInWith(info.signs_in_with)
                if (info.role) setRole(info.role)
              }}
              onSessionEnded={onSessionEnded}
              onDeleted={onDeleted}
            />
          )}

          {section === 'notifications' && (
            <section className="workspace-card settings-card">
              <div className="workspace-title-row">
                <h2>Notifications</h2>
                {savedNotice && <span className="settings-save-status" role="status"><Check size={14} />{savedNotice}</span>}
              </div>
              <p>Choose which live alerts appear while AutoWallet is open in this browser.</p>
              <div className="settings-notification-rows">
                <div className="settings-notification-row">
                  <div>
                    <h3>Payment received</h3>
                    <p>Show a live banner and add an item to the notification bell when a payment is processed.</p>
                  </div>
                  <div className="settings-notification-switches">
                    <label>
                      <input
                        type="checkbox"
                        checked={paymentAlertsEnabled}
                        onChange={(event) => updatePaymentAlerts(event.target.checked)}
                      />
                      <span className="settings-switch-track" aria-hidden="true" />
                      In-app
                    </label>
                  </div>
                </div>
                <div className="settings-notification-row">
                  <div>
                    <h3>Security emails</h3>
                    <p>Verification, password reset, and account deletion codes are always sent when you request those actions.</p>
                  </div>
                  <div className="settings-notification-switches">
                    <label>
                      <input type="checkbox" checked disabled />
                      <span className="settings-switch-track" aria-hidden="true" />
                      Required
                    </label>
                  </div>
                </div>
              </div>
            </section>
          )}

          {section === 'developer' && (
            <>
              <section className="workspace-card settings-card">
                <div className="workspace-title-row">
                  <h2>AI Assistant API key</h2>
                  <span className={`settings-status ${aiConfig?.apiKey ? 'settings-status--on' : ''}`}>
                    {aiConfig?.apiKey ? <Check size={13} /> : <Sparkles size={13} />}
                    {aiConfig?.apiKey ? 'Configured' : 'Not configured'}
                  </span>
                </div>
                <p>
                  Configure your Gemini or OpenAI API key directly here so the Assistant can answer questions about your money, active rules, and envelope balances.
                </p>

                {aiNotice && (
                  <p className="workspace-banner workspace-banner--success" role="status">
                    {aiNotice}
                  </p>
                )}

                <form
                  className="settings-form"
                  onSubmit={(e) => {
                    e.preventDefault()
                    handleSaveAiConfig()
                  }}
                  noValidate
                >
                  <label htmlFor="settings-ai-key">
                    API key
                    <div className="settings-setup-key mt-1">
                      <input
                        id="settings-ai-key"
                        className="dashboard-input"
                        type={showAiKey ? 'text' : 'password'}
                        value={aiKeyDraft}
                        onChange={(e) => setAiKeyDraft(e.target.value)}
                        placeholder="e.g. AIzaSy... or sk-..."
                        autoComplete="off"
                        spellCheck={false}
                      />
                      <button
                        type="button"
                        onClick={() => setShowAiKey((prev) => !prev)}
                        aria-label={showAiKey ? 'Hide API key' : 'Show API key'}
                      >
                        {showAiKey ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    <span className="workspace-note">
                      Supports Google Gemini (starts with <code>AIzaSy</code>) or OpenAI (starts with <code>sk-</code>). Stored locally in your browser.
                    </span>
                  </label>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                    <label htmlFor="settings-ai-model">
                      Model (optional)
                      <input
                        id="settings-ai-model"
                        className="dashboard-input mt-1"
                        value={aiModelDraft}
                        onChange={(e) => setAiModelDraft(e.target.value)}
                        placeholder={aiKeyDraft.startsWith('sk-') ? 'gpt-4o-mini' : 'gemini-1.5-flash'}
                      />
                    </label>
                    <label htmlFor="settings-ai-url">
                      Base URL (optional)
                      <input
                        id="settings-ai-url"
                        className="dashboard-input mt-1"
                        value={aiBaseUrlDraft}
                        onChange={(e) => setAiBaseUrlDraft(e.target.value)}
                        placeholder={aiKeyDraft.startsWith('sk-') ? 'https://api.openai.com/v1' : 'https://generativelanguage.googleapis.com/v1beta/openai'}
                      />
                    </label>
                  </div>

                  <div className="settings-actions mt-4">
                    <button
                      type="submit"
                      className="dashboard-primary-button"
                      disabled={!aiKeyDraft.trim()}
                    >
                      Save AI key
                    </button>
                    {aiConfig?.apiKey && (
                      <button
                        type="button"
                        className="settings-danger-outline"
                        onClick={handleRemoveAiConfig}
                      >
                        Remove key
                      </button>
                    )}
                  </div>
                </form>
              </section>

              <section className="workspace-card settings-card">
                <h2>Personal API keys</h2>
                <p>Create personal API keys to record incoming client payments or query your envelopes programmatically.</p>

              <form className="settings-form" onSubmit={(event) => void handleCreateKey(event)} noValidate>
                <label htmlFor="new-api-key-name">
                  New API key name
                  <input
                    id="new-api-key-name"
                    className="dashboard-input"
                    value={keyNameDraft}
                    onChange={(event) => {
                      setKeyNameDraft(event.target.value)
                      setKeyError(null)
                    }}
                    placeholder="e.g. Invoicing webhook"
                    maxLength={60}
                    disabled={!online || keyCreating}
                  />
                </label>
                {keyError && (
                  <p className="workspace-field-error" role="alert">
                    {keyError}
                  </p>
                )}
                <button
                  type="submit"
                  className="dashboard-primary-button"
                  disabled={!online || keyCreating || !keyNameDraft.trim()}
                >
                  <Plus size={15} />
                  {keyCreating ? 'Creating…' : 'Create API key'}
                </button>
              </form>

              {newlyCreatedKey && (
                <div className="settings-code-block" role="status">
                  <header>
                    <span>Copy your new API key now — it won&apos;t be shown again</span>
                    <button
                      type="button"
                      onClick={() => {
                        void navigator.clipboard
                          ?.writeText(newlyCreatedKey)
                          .then(() => setCopiedNewKey(true))
                          .catch(() => setCopiedNewKey(false))
                      }}
                    >
                      {copiedNewKey ? <Check size={13} /> : <Copy size={13} />}
                      <span>{copiedNewKey ? 'Copied' : 'Copy key'}</span>
                    </button>
                  </header>
                  <pre><code>{newlyCreatedKey}</code></pre>
                </div>
              )}

              {keysLoading ? (
                <p className="workspace-note">Loading API keys…</p>
              ) : apiKeys.length === 0 ? (
                <div className="settings-empty-keys">
                  <KeyRound size={20} />
                  <div>
                    <strong>No personal API keys yet</strong>
                    <p>Create a personal key above to authenticate external scripts or invoice webhooks without exposing your browser session.</p>
                  </div>
                </div>
              ) : (
                <dl className="settings-data-list" aria-label="Personal API keys">
                  {apiKeys.map((keyItem) => (
                    <div key={keyItem.id}>
                      <dt>
                        <strong className="text-[var(--aw-ink)]">{keyItem.name}</strong>
                        <span className="ml-2 font-mono text-xs">{keyItem.prefix}</span>
                      </dt>
                      <dd className="flex items-center gap-3">
                        <span className="text-xs text-[var(--aw-muted)]">
                          Created {new Date(keyItem.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                        <button
                          type="button"
                          className="settings-danger-outline"
                          onClick={() => void handleRevokeKey(keyItem.id)}
                          disabled={!online}
                          aria-label={`Revoke ${keyItem.name}`}
                        >
                          <Trash2 size={13} />
                          Revoke
                        </button>
                      </dd>
                    </div>
                  ))}
                </dl>
              )}

              <div className="settings-api-reference">
                <h3>POST /api/transactions/</h3>
                <p>Authenticated requests with your personal API key or Bearer token record a payment and run your active envelope rules.</p>
                <div className="settings-code-block">
                  <header>
                    <span>cURL example</span>
                    <button type="button" onClick={() => void copyCurl()}>
                      {copiedCurl ? <Check size={13} /> : <Copy size={13} />}
                      <span>{copiedCurl ? 'Copied' : 'Copy'}</span>
                    </button>
                  </header>
                  <pre><code>{curlExample}</code></pre>
                </div>
              </div>
            </section>
          </>
        )}
        </div>
      </div>

      <button type="button" className="settings-danger-outline settings-mobile-signout" onClick={onSignOut}>
        <LogOut size={15} />
        Log out
      </button>
    </div>
  )
}
