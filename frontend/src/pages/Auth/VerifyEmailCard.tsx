import { useCountdown } from '../../hooks/useCountdown'
import { LegalFooter } from '../../components/common/LegalFooter'

import { useNavigate, useSearchParams } from 'react-router-dom'
import { Mail } from 'lucide-react'
import { translations } from '../../i18n'

export function VerifyEmailCard() {
  const t = translations
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const emailParam = searchParams.get('email') || (() => {
    try {
      const stored = sessionStorage.getItem('autowallet_signup_draft')
      const email = stored ? (JSON.parse(stored) as { email?: unknown }).email : null
      return typeof email === 'string' && email ? email : 'your email address'
    } catch {
      return 'your email address'
    }
  })()

  const { countdown, startCountdown } = useCountdown()


  const handleResend = () => {
    if (countdown > 0) return
    startCountdown(60)
  }

  return (
    <main className="w-full flex-1 flex flex-col items-center justify-center px-4 py-3 sm:py-5 z-10 animate-in fade-in duration-200">
      {/* 440px Centered White Card per Figma #116:995 */}
      <div className="w-full max-w-[440px] bg-white rounded-2xl border border-[#DDE3EA] p-6 sm:p-9 shadow-[0_8px_24px_-4px_rgba(27,36,50,0.08),0_2px_6px_-1px_rgba(27,36,50,0.04)] text-center flex flex-col items-center space-y-5">
        <div className="w-12 h-12 rounded-full bg-[#ECEEFA] flex items-center justify-center text-[#5A64B4]">
          <Mail className="w-6 h-6" />
        </div>

        <div className="space-y-1.5">
          <h1 className="text-2xl font-semibold text-[#1A2330] tracking-tight">
            {t.checkInboxTitle}
          </h1>
          <p className="text-[15px] text-[#5E6B7E] leading-relaxed max-w-[340px]">
            {t.verifyEmailSubtitle.replace('{email}', emailParam)}
          </p>
        </div>

        <div className="w-full pt-3 space-y-2.5">
          {/* Primary Action: Continue setting up (does not block onboarding per Note #116:1033) */}
          <button
            type="button"
            onClick={() => navigate('/welcome/about')}
            className="w-full h-11 sm:h-12 px-4 rounded-[10px] bg-[#5A64B4] hover:bg-[#4A53A0] active:bg-[#3F4789] text-white font-medium text-sm transition flex items-center justify-center cursor-pointer shadow-xs"
          >
            {t.continueSettingUp}
          </button>

          {/* Secondary Action: Send the link again */}
          <button
            type="button"
            onClick={handleResend}
            disabled={countdown > 0}
            className="w-full h-11 sm:h-12 px-4 rounded-[10px] border border-[#DDE3EA] bg-white hover:bg-[#F3F6FA] active:bg-[#EDF0F4] disabled:opacity-60 disabled:hover:bg-white text-[#3B495D] font-medium text-sm transition flex items-center justify-center cursor-pointer"
          >
            {countdown > 0
              ? `${t.sendLinkAgainIn} (${countdown}s)`
              : t.sendLinkAgain}
          </button>
        </div>
      </div>

      {/* Legal Footer */}
      <LegalFooter t={t} />
    </main>
  )
}
