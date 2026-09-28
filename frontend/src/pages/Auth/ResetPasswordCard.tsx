import { useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  LockKeyhole,
  CheckCircle2,
  AlertTriangle,
  Eye,
  EyeOff,
  Check,
  Minus,
  Loader2,
} from 'lucide-react'
import { getTranslations } from '../../i18n'
import type { Language } from '../../i18n'

interface ResetPasswordCardProps {
  currentLang: Language
}

export function ResetPasswordCard({ currentLang }: ResetPasswordCardProps) {
  const t = getTranslations(currentLang)
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const isExpiredParam = searchParams.get('status') === 'expired'

  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [isExpired] = useState(isExpiredParam)

  // Password strength calculation matching Signup & A6
  const calculatePasswordStrength = (pwd: string): number => {
    if (!pwd) return 0
    let score = 0
    if (pwd.length >= 8) score += 1
    if (/[A-Z]/.test(pwd) && /[a-z]/.test(pwd)) score += 1
    if (/\d/.test(pwd)) score += 1
    if (/[^A-Za-z0-9]/.test(pwd) || pwd.length >= 12) score += 1
    return score
  }

  const pwStrength = calculatePasswordStrength(password)

  const getStrengthMeta = () => {
    switch (pwStrength) {
      case 2:
        return { label: t.pwStrengthFair, color: 'bg-[#EB6834]', text: 'text-[#EB6834]' }
      case 3:
        return { label: t.pwStrengthGood, color: 'bg-[#EDA100]', text: 'text-[#EDA100]' }
      case 4:
        return { label: t.pwStrengthStrong, color: 'bg-[#1BAF7A]', text: 'text-[#1BAF7A]' }
      case 1:
        return { label: t.pwStrengthWeak, color: 'bg-[#C62F31]', text: 'text-[#C62F31]' }
      default:
        return { label: '', color: 'bg-[#DDE3EA]', text: 'text-[#5E6B7E]' }
    }
  }

  const strengthMeta = getStrengthMeta()

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (password.length < 8 || loading) return

    setLoading(true)

    // Planned API: POST /api/auth/password/reset
    try {
      await fetch('/api/auth/password/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      }).catch(() => {
        // Fallback for preview/mock testing
      })
    } finally {
      setLoading(false)
      setIsSuccess(true)
    }
  }

  return (
    <main className="w-full flex-1 flex flex-col items-center justify-center px-4 py-3 sm:py-5 z-10 animate-in fade-in duration-200">
      {/* 440px Centered White Card per Figma #116:908 & #116:960 */}
      <div className="w-full max-w-[440px] bg-white rounded-2xl border border-[#DDE3EA] p-6 sm:p-9 shadow-[0_8px_24px_-4px_rgba(27,36,50,0.08),0_2px_6px_-1px_rgba(27,36,50,0.04)] transition-all">
        {isExpired ? (
          /* Expired Link State per Figma Note #116:956 */
          <div className="space-y-5 text-center flex flex-col items-center">
            <div
              role="alert"
              className="w-full p-4 rounded-xl bg-[#FFF7ED] border border-[#FED7AA] text-[#9A3412] text-sm flex items-start gap-3 text-left"
            >
              <AlertTriangle className="w-5 h-5 shrink-0 text-[#EB6834] mt-0.5" />
              <div className="flex-1 leading-snug">
                <span>{t.resetLinkExpired}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => navigate('/forgot-password')}
              className="w-full h-11 sm:h-12 px-4 rounded-[10px] bg-[#5A64B4] hover:bg-[#4A53A0] text-white font-medium text-sm transition flex items-center justify-center cursor-pointer shadow-xs"
            >
              {t.askForNewLink}
            </button>
          </div>
        ) : isSuccess ? (
          /* Screen 4: Password changed (#116:960) */
          <div className="flex flex-col items-center text-center space-y-5">
            <div className="w-12 h-12 rounded-full bg-[#E3F5EE] flex items-center justify-center text-[#1BAF7A]">
              <CheckCircle2 className="w-6 h-6" />
            </div>

            <div className="space-y-1.5">
              <h1 className="text-2xl font-semibold text-[#1A2330] tracking-tight">
                {t.passwordChangedTitle}
              </h1>
              <p className="text-[15px] text-[#5E6B7E] leading-relaxed">
                {t.passwordChangedSubtitle}
              </p>
            </div>

            <div className="w-full pt-2">
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="w-full h-11 sm:h-12 px-4 rounded-[10px] bg-[#5A64B4] hover:bg-[#4A53A0] text-white font-medium text-sm transition flex items-center justify-center cursor-pointer shadow-xs"
              >
                {t.loginButton}
              </button>
            </div>
          </div>
        ) : (
          /* Screen 3: Choose a new password (#116:908) */
          <div>
            <div className="w-12 h-12 rounded-full bg-[#ECEEFA] flex items-center justify-center mb-5 text-[#5A64B4]">
              <LockKeyhole className="w-6 h-6" />
            </div>

            <div className="mb-6 space-y-1">
              <h1 className="text-2xl font-semibold text-[#1A2330] tracking-tight">
                {t.chooseNewPasswordTitle}
              </h1>
              <p className="text-[15px] text-[#5E6B7E] leading-relaxed">
                {t.chooseNewPasswordSubtitle}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="new-password-input" className="block text-sm font-medium text-[#1A2330]">
                  {t.newPasswordLabel}
                </label>

                <div className="relative">
                  <input
                    id="new-password-input"
                    type={showPassword ? 'text' : 'password'}
                    required
                    autoFocus
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={t.passwordPlaceholder}
                    className="w-full h-11 pl-3.5 pr-10 rtl:pr-3.5 rtl:pl-10 rounded-[10px] border border-[#DDE3EA] bg-white text-[#1A2330] placeholder:text-[#8C9BAE] text-sm focus:outline-none focus:border-[#5A64B4] focus:ring-2 focus:ring-[#5A64B4]/20 transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 rtl:right-auto rtl:left-3 top-1/2 -translate-y-1/2 text-[#5E6B7E] hover:text-[#1A2330] p-1 cursor-pointer transition"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* 4-segment strength meter (matching A2 Sign up & A6) */}
                <div className="pt-2 space-y-2">
                  <div className="grid grid-cols-4 gap-1.5 h-1 w-full" aria-hidden="true">
                    {[1, 2, 3, 4].map((step) => (
                      <div
                        key={step}
                        className={`h-full rounded-full transition-colors duration-200 ${
                          pwStrength >= step ? strengthMeta.color : 'bg-[#DDE3EA]'
                        }`}
                      />
                    ))}
                  </div>

                  <div className="flex items-center justify-between text-xs text-[#5E6B7E]">
                    <div className="flex items-center gap-1.5">
                      {password.length >= 8 ? (
                        <Check className="w-3.5 h-3.5 text-[#1BAF7A]" />
                      ) : (
                        <Minus className="w-3.5 h-3.5 text-[#5E6B7E]" />
                      )}
                      <span className={password.length >= 8 ? 'text-[#1A2330] font-medium' : 'text-[#5E6B7E]'}>
                        {t.pwRequirement}
                      </span>
                    </div>
                    {password.length > 0 && (
                      <span className={`font-semibold ${strengthMeta.text}`}>
                        {strengthMeta.label}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={password.length < 8 || loading}
                  className="w-full h-11 sm:h-12 px-4 rounded-[10px] bg-[#5A64B4] hover:bg-[#4A53A0] active:bg-[#3F4789] disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium text-sm transition flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>{t.savingPassword}</span>
                    </>
                  ) : (
                    t.savePassword
                  )}
                </button>
              </div>
            </form>
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
