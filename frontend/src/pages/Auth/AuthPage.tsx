import type { Language } from '../../i18n'
import { TopBar } from '../../components/common/TopBar'
import { AuthCard } from './AuthCard'
import { TwoFactorCard } from './TwoFactorCard'
import { SessionEndedCard } from './SessionEndedCard'
import { ForgotPasswordCard } from './ForgotPasswordCard'
import { ResetPasswordCard } from './ResetPasswordCard'
import { VerifyEmailCard } from './VerifyEmailCard'

interface AuthPageProps {
  mode:
    | 'login'
    | 'signup'
    | '2fa'
    | 'session-ended'
    | 'forgot-password'
    | 'reset-password'
    | 'verify-email'
  currentLang: Language
  onSelectLang: (lang: Language) => void
}

export function AuthPage({ mode, currentLang, onSelectLang }: AuthPageProps) {
  return (
    <div className="min-h-screen w-full bg-[#F3F6FA] flex flex-col">
      <TopBar currentLang={currentLang} onSelectLang={onSelectLang} />
      {mode === '2fa' ? (
        <TwoFactorCard currentLang={currentLang} />
      ) : mode === 'session-ended' ? (
        <SessionEndedCard currentLang={currentLang} />
      ) : mode === 'forgot-password' ? (
        <ForgotPasswordCard currentLang={currentLang} />
      ) : mode === 'reset-password' ? (
        <ResetPasswordCard currentLang={currentLang} />
      ) : mode === 'verify-email' ? (
        <VerifyEmailCard currentLang={currentLang} />
      ) : (
        <AuthCard mode={mode} currentLang={currentLang} />
      )}
    </div>
  )
}
