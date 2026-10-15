import { lazy, Suspense } from 'react'
import { TopBar } from '../../components/common/TopBar'
import { AuthCard } from './AuthCard'
import { SessionEndedCard } from './SessionEndedCard'

const TwoFactorCard = lazy(() => import('./TwoFactorCard').then(({ TwoFactorCard }) => ({ default: TwoFactorCard })))
const ForgotPasswordCard = lazy(() => import('./ForgotPasswordCard').then(({ ForgotPasswordCard }) => ({ default: ForgotPasswordCard })))
const ResetPasswordCard = lazy(() => import('./ResetPasswordCard').then(({ ResetPasswordCard }) => ({ default: ResetPasswordCard })))
const VerifyEmailCard = lazy(() => import('./VerifyEmailCard').then(({ VerifyEmailCard }) => ({ default: VerifyEmailCard })))

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
      <Suspense fallback={<main className="flex flex-1 items-center justify-center" role="status">Loading…</main>}>
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
      </Suspense>
    </div>
  )
}
