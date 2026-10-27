import { lazy, Suspense } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthPage } from './pages/Auth/AuthPage'
import { onboardingPaths } from './pages/Onboarding/routes'
import { useTranslation } from './i18n'

const GoogleCallbackPage = lazy(() => import('./pages/Auth/GoogleCallbackPage').then(({ GoogleCallbackPage: Page }) => ({ default: Page })))
const LegalPage = lazy(() => import('./pages/Legal/LegalPage').then(({ LegalPage: Page }) => ({ default: Page })))
const OnboardingPage = lazy(() => import('./pages/Onboarding/OnboardingPage').then(({ OnboardingPage: Page }) => ({ default: Page })))
const DashboardPage = lazy(() => import('./pages/Dashboard/DashboardPage').then(({ DashboardPage: Page }) => ({ default: Page })))

const authRoutes = {
  '/login': 'login',
  '/signup': 'signup',
  '/login/2fa': '2fa',
  '/session-ended': 'session-ended',
  '/forgot-password': 'forgot-password',
  '/reset-password': 'reset-password',
  '/verify-email': 'verify-email',
  '/auth/verify-email': 'verify-email',
} as const

const workspaceRoutes = [
  '/dashboard',
  '/app/activity',
  '/app/activity/:paymentId',
  '/app/analytics',
  '/app/assistant',
  '/app/notifications',
  '/app/sandbox',
  '/app/settings',
  '/app/settings/:section',
  '/app/rules',
  '/app/envelopes',
  '/app/envelopes/:walletType',
]

export default function App() {
  // Subscribing at the root keeps every page's copy in sync with the language selector.
  useTranslation()

  return (
    <BrowserRouter>
      <Suspense
        fallback={
          <div role="status" className="flex min-h-screen items-center justify-center text-sm text-muted">
            Loading…
          </div>
        }
      >
        <Routes>
          {Object.entries(authRoutes).map(([path, mode]) => (
            <Route key={path} path={path} element={<AuthPage key={mode} mode={mode} />} />
          ))}

          <Route path="/auth/google/callback" element={<GoogleCallbackPage />} />

          {onboardingPaths.map((path) => (
            <Route key={path} path={path} element={<OnboardingPage />} />
          ))}
          <Route path="/onboarding" element={<Navigate to="/welcome/about" replace />} />

          <Route path="/" element={<Navigate to="/login" replace />} />

          {workspaceRoutes.map((path) => (
            <Route key={path} path={path} element={<DashboardPage />} />
          ))}

          <Route path="/maintenance" element={<Navigate to="/dashboard" replace />} />
          {/* Preserve links shared from the original account pages. */}
          <Route path="/analytics" element={<Navigate to="/app/analytics" replace />} />
          <Route path="/assistant" element={<Navigate to="/app/assistant" replace />} />
          <Route path="/account/privacy" element={<Navigate to="/app/settings/privacy" replace />} />
          <Route path="/terms" element={<LegalPage document="terms" />} />
          <Route path="/privacy" element={<LegalPage document="privacy" />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}
