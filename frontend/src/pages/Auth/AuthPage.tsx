import { lazy, Suspense } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { getToken } from '../../auth/session'
import { TopBar } from '../../components/layout/TopBar'
import { AuthCard } from './AuthCard'
import { SessionEndedCard } from './SessionEndedCard'

const TwoFactorCard = lazy(() => import('./TwoFactorCard').then(({ TwoFactorCard: Card }) => ({ default: Card })))
const ForgotPasswordCard = lazy(() => import('./ForgotPasswordCard').then(({ ForgotPasswordCard: Card }) => ({ default: Card })))
const ResetPasswordCard = lazy(() => import('./ResetPasswordCard').then(({ ResetPasswordCard: Card }) => ({ default: Card })))
const VerifyEmailCard = lazy(() => import('./VerifyEmailCard').then(({ VerifyEmailCard: Card }) => ({ default: Card })))

interface AuthPageProps {
  mode: 'login' | 'signup' | '2fa' | 'session-ended' | 'forgot-password' | 'reset-password' | 'verify-email'
}

function AuthContent({ mode }: AuthPageProps) {
  switch (mode) {
    case '2fa':
      return <TwoFactorCard />
    case 'session-ended':
      return <SessionEndedCard />
    case 'forgot-password':
      return <ForgotPasswordCard />
    case 'reset-password':
      return <ResetPasswordCard />
    case 'verify-email':
      return <VerifyEmailCard />
    default:
      return <AuthCard mode={mode} />
  }
}

export function AuthPage({ mode }: AuthPageProps) {
  const location = useLocation()
  const accountDeleted = mode === 'login' && location.state?.accountDeleted === true

  const token = getToken()
  if (token && (mode === 'login' || mode === 'signup') && !accountDeleted) {
    return <Navigate to="/dashboard" replace />
  }

  return (
    <div className="flex min-h-screen w-full flex-col bg-canvas">
      <TopBar />
      {accountDeleted && (
        <p role="status" className="mx-auto mt-6 max-w-md rounded-xl bg-success-soft px-5 py-4 text-sm text-success-ink">
          Your account and all its data have been deleted.
        </p>
      )}
      <Suspense fallback={<main className="flex flex-1 items-center justify-center" role="status">Loading…</main>}>
        <AuthContent mode={mode} />
      </Suspense>
    </div>
  )
}
