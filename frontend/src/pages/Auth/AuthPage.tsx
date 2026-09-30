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
}

export function AuthPage({ mode }: AuthPageProps) {
  return (
    <div className="min-h-screen w-full bg-[#F3F6FA] flex flex-col">
      <TopBar />
      {mode === '2fa' ? (
        <TwoFactorCard />
      ) : mode === 'session-ended' ? (
        <SessionEndedCard />
      ) : mode === 'forgot-password' ? (
        <ForgotPasswordCard />
      ) : mode === 'reset-password' ? (
        <ResetPasswordCard />
      ) : mode === 'verify-email' ? (
        <VerifyEmailCard />
      ) : (
        <AuthCard mode={mode} />
      )}
    </div>
  )
}
