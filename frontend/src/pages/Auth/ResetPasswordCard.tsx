import { TextInput } from '../../components/ui/TextInput'
import { Button } from '../../components/ui/Button'
import { AuthPanel } from '../../components/ui/AuthPanel'
import { PASSWORD_RECOVERY_UNAVAILABLE, SERVICE_UNAVAILABLE } from '../../content/messages'
import { LegalFooter } from '../../components/common/LegalFooter'
import { PasswordStrength } from '../../components/common/PasswordStrength'
import { useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  LockKeyhole,
  CheckCircle2,
  AlertTriangle,
  Eye,
  EyeOff,
  Loader2,
} from 'lucide-react'
import { apiFetch } from '../../api/request'
import { useRequestSignal } from '../../hooks/useRequestSignal'
import { usePendingNavigation } from '../../hooks/usePendingNavigation'

export function ResetPasswordCard() {
  const navigate = useNavigate()
  const requestSignal = useRequestSignal()
  const [searchParams] = useSearchParams()

  const isExpired = searchParams.get('status') === 'expired' || !searchParams.get('token')

  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const navigationBlocked = usePendingNavigation(loading, { allowSignedOut: true })
  const [isSuccess, setIsSuccess] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (password.length < 8 || loading) return

    const signal = requestSignal()
    setLoading(true)

    setErrorMessage(null)
    try {
      const response = await apiFetch('/api/auth/password/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password, token: searchParams.get('token') }),
        signal,
      })
      if (response.status === 404) {
        setErrorMessage(PASSWORD_RECOVERY_UNAVAILABLE)
        return
      }
      if (!response.ok) throw new Error('Password reset failed')
      setIsSuccess(true)
    } catch {
      if (!signal.aborted) setErrorMessage(SERVICE_UNAVAILABLE)
    } finally {
      if (!signal.aborted) setLoading(false)
    }
  }

  return (
    <main className="w-full flex-1 flex flex-col items-center justify-center px-4 py-3 sm:py-5 z-10 animate-in fade-in duration-200">
      {/* 440px Centered White Card per Figma #116:908 & #116:960 */}
      <AuthPanel className="transition-all">
        {isExpired ? (
          /* Expired Link State per Figma Note #116:956 */
          <div className="space-y-5 text-center flex flex-col items-center">
            <div
              role="alert"
              className="w-full p-4 rounded-xl bg-[#FFF7ED] border border-[#FED7AA] text-[#9A3412] text-sm flex items-start gap-3 text-left"
            >
              <AlertTriangle className="w-5 h-5 shrink-0 text-tax-solid mt-0.5" />
              <div className="flex-1 leading-snug">
                <span>This link has expired. Ask for a new one.</span>
              </div>
            </div>

            <Button appearance="auth" variant="primary"
              type="button"
              onClick={() => navigate('/forgot-password')}
            >
              Ask for a new link
            </Button>
          </div>
        ) : isSuccess ? (
          /* Screen 4: Password changed (#116:960) */
          <div className="flex flex-col items-center text-center space-y-5">
            <div className="w-12 h-12 rounded-full bg-savings-tint flex items-center justify-center text-savings-solid">
              <CheckCircle2 className="w-6 h-6" />
            </div>

            <div className="space-y-1.5">
              <h1 className="text-2xl font-semibold text-brand-ink tracking-tight">
                Password changed
              </h1>
              <p className="text-[15px] text-brand-muted leading-relaxed">
                Log in with your new password.
              </p>
            </div>

            <div className="w-full pt-2">
              <Button appearance="auth" variant="primary"
                type="button"
                onClick={() => navigate('/login')}
              >
                Log in
              </Button>
            </div>
          </div>
        ) : (
          /* Screen 3: Choose a new password (#116:908) */
          <div>
            <div className="w-12 h-12 rounded-full bg-action-primary-subtle flex items-center justify-center mb-5 text-action-primary">
              <LockKeyhole className="w-6 h-6" />
            </div>

            <div className="mb-6 space-y-1">
              <h1 className="text-2xl font-semibold text-brand-ink tracking-tight">
                Choose a new password
              </h1>
              <p className="text-[15px] text-brand-muted leading-relaxed">
                Use at least 8 characters and choose a password you don’t use elsewhere.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {errorMessage && <p role="alert" className="text-sm text-action-danger">{errorMessage}</p>}
              {navigationBlocked && <p role="status" className="text-sm text-brand-muted">Wait for the password update to finish before leaving this page.</p>}
              <div className="space-y-1.5">
                <label htmlFor="new-password-input" className="block text-sm font-medium text-brand-ink">
                  New password
                </label>

                <div className="relative">
                  <TextInput appearance="auth"
                    id="new-password-input"
                    autoComplete="new-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    autoFocus
                    value={password}
                    disabled={loading}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-muted hover:text-brand-ink p-1 cursor-pointer transition"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* 4-segment strength meter (matching A2 Sign up & A6) */}
                <PasswordStrength password={password} className="pt-2" />
              </div>

              <div className="pt-2">
                <Button appearance="auth" variant="primary"
                  type="submit"
                  disabled={password.length < 8 || loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Saving password…</span>
                    </>
                  ) : (
                    "Save password"
                  )}
                </Button>
              </div>
            </form>
          </div>
        )}
      </AuthPanel>

      {/* Legal Footer */}
      <LegalFooter />
    </main>
  )
}
