import { useState, useEffect } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { KeyRound, MailCheck, ArrowLeft, Loader2 } from 'lucide-react'
import { getTranslations } from '../../i18n'
import type { Language } from '../../i18n'

interface ForgotPasswordCardProps {
  currentLang: Language
}

export function ForgotPasswordCard({ currentLang }: ForgotPasswordCardProps) {
  const t = getTranslations(currentLang)
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [countdown, setCountdown] = useState(0)

  // Countdown timer for resend link per Figma Note #116:904 (60s cooldown)
  useEffect(() => {
    if (countdown <= 0) return
    const timer = setInterval(() => {
      setCountdown((prev) => Math.max(0, prev - 1))
    }, 1000)
    return () => clearInterval(timer)
  }, [countdown])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!email.trim() || loading) return

    setLoading(true)

    // Planned API: POST /api/auth/password/forgot per Note #116:864
    try {
      await fetch('/api/auth/password/forgot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      }).catch(() => {
        // Safe silent handling per design: same message whether account exists or not
      })
    } finally {
      setLoading(false)
      setSubmitted(true)
      setCountdown(60)
    }
  }

  const handleResend = () => {
    if (countdown > 0) return
    setCountdown(60)
    // Resend trigger
  }

  return (
    <main className="w-full flex-1 flex flex-col items-center justify-center px-4 py-3 sm:py-5 z-10 animate-in fade-in duration-200">
      {/* 440px Centered Card per Figma #116:816 & #116:868 */}
      <div className="w-full max-w-[440px] bg-white rounded-2xl border border-[#DDE3EA] p-6 sm:p-9 shadow-[0_8px_24px_-4px_rgba(27,36,50,0.08),0_2px_6px_-1px_rgba(27,36,50,0.04)] transition-all">
        {submitted ? (
          /* Screen 2: Link sent / Check your inbox (#116:868) */
          <div className="flex flex-col items-center text-center space-y-5">
            <div className="w-12 h-12 rounded-full bg-[#ECEEFA] flex items-center justify-center text-[#5A64B4]">
              <MailCheck className="w-6 h-6" />
            </div>

            <div className="space-y-1.5">
              <h1 className="text-2xl font-semibold text-[#1A2330] tracking-tight">
                {t.checkInboxTitle}
              </h1>
              <p className="text-[15px] text-[#5E6B7E] leading-relaxed max-w-[340px]">
                {t.resetLinkSentSubtitle.replace('{email}', email)}
              </p>
            </div>

            {/* Resend button with 60s cooldown per Note #116:904 */}
            <div className="w-full pt-2">
              <button
                type="button"
                onClick={handleResend}
                disabled={countdown > 0}
                className="w-full h-11 sm:h-12 px-4 rounded-[10px] bg-[#EDF0F4] hover:bg-[#E2E7ED] disabled:opacity-60 disabled:hover:bg-[#EDF0F4] text-[#1A2330] font-medium text-sm transition cursor-pointer"
              >
                {countdown > 0
                  ? `${t.sendLinkAgainIn} (${countdown}s)`
                  : t.sendLinkAgain}
              </button>
            </div>

            {/* Test shortcut link to reset password view in preview */}
            <div className="text-xs text-[#8C9BAE]">
              Preview mode:{' '}
              <button
                type="button"
                onClick={() => navigate('/reset-password?token=demo-reset-token')}
                className="underline text-[#5A64B4] hover:text-[#4A53A0] cursor-pointer"
              >
                simulate opening reset link
              </button>
            </div>

            {/* Back to log in link */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="inline-flex items-center gap-2 text-sm font-medium text-[#4A53A0] hover:text-[#3B495D] hover:underline cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4 rtl:rotate-180" />
                <span>{t.backToLogIn}</span>
              </button>
            </div>
          </div>
        ) : (
          /* Screen 1: Reset your password form (#116:816 & #116:1037) */
          <div>
            <div className="w-12 h-12 rounded-full bg-[#ECEEFA] flex items-center justify-center mb-5 text-[#5A64B4]">
              <KeyRound className="w-6 h-6" />
            </div>

            <div className="mb-6 space-y-1">
              <h1 className="text-2xl font-semibold text-[#1A2330] tracking-tight">
                {t.forgotPasswordTitle}
              </h1>
              <p className="text-[15px] text-[#5E6B7E] leading-relaxed">
                {t.forgotPasswordSubtitle}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="reset-email" className="block text-sm font-medium text-[#1A2330]">
                  {t.emailLabel}
                </label>
                <input
                  id="reset-email"
                  type="email"
                  required
                  autoFocus
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full h-11 px-3.5 rounded-[10px] border border-[#DDE3EA] bg-white text-[#1A2330] placeholder:text-[#8C9BAE] text-sm focus:outline-none focus:border-[#5A64B4] focus:ring-2 focus:ring-[#5A64B4]/20 transition"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={!email.trim() || loading}
                  className="w-full h-11 sm:h-12 px-4 rounded-[10px] bg-[#5A64B4] hover:bg-[#4A53A0] active:bg-[#3F4789] disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium text-sm transition flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Sending…</span>
                    </>
                  ) : (
                    t.sendResetLink
                  )}
                </button>
              </div>
            </form>

            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="inline-flex items-center gap-2 text-sm font-medium text-[#4A53A0] hover:text-[#3B495D] hover:underline cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4 rtl:rotate-180" />
                <span>{t.backToLogIn}</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Legal Footer */}
      <footer className="mt-6 text-center text-xs text-[#5E6B7E] flex items-center justify-center gap-4">
        <button
          type="button"
          onClick={() => alert('AutoWallet Privacy Policy: Your financial split rules are computed locally/securely.')}
          className="hover:text-[#1A2330] hover:underline cursor-pointer"
        >
          {t.privacy}
        </button>
        <span>·</span>
        <button
          type="button"
          onClick={() => alert('AutoWallet Terms of Service: Ledger budgeting simulation.')}
          className="hover:text-[#1A2330] hover:underline cursor-pointer"
        >
          {t.terms}
        </button>
      </footer>
    </main>
  )
}
