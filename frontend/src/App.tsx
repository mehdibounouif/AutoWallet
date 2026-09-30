import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthPage } from './pages/Auth/AuthPage'
import { GoogleCallbackPage } from './pages/Auth/GoogleCallbackPage'
import { MaintenancePage } from './pages/Maintenance/MaintenancePage'
import { onboardingPaths } from './pages/Onboarding/routes'

const OnboardingPage = lazy(() =>
  import('./pages/Onboarding/OnboardingPage').then(({ OnboardingPage }) => ({
    default: OnboardingPage,
  })),
)

const authRoutes = {
  '/login': 'login',
  '/signup': 'signup',
  '/login/2fa': '2fa',
  '/session-ended': 'session-ended',
  '/forgot-password': 'forgot-password',
  '/reset-password': 'reset-password',
  '/verify-email': 'verify-email',
} as const

export default function App() {
  return (
    <BrowserRouter>
      <Suspense
        fallback={
          <div role="status" className="min-h-screen flex items-center justify-center">
            Loading…
          </div>
        }
      >
        <Routes>
          {Object.entries(authRoutes).map(([path, mode]) => (
            <Route
              key={path}
              path={path}
              element={
                <AuthPage mode={mode} />
              }
            />
          ))}

          {/* Figma A3: Continue with Google OAuth Callback */}
          <Route
            path="/auth/google/callback"
            element={
              <GoogleCallbackPage />
            }
          />

          {onboardingPaths.map((path) => (
            <Route
              key={path}
              path={path}
              element={<OnboardingPage />}
            />
          ))}

          <Route path="/onboarding" element={<Navigate to="/welcome/about" replace />} />

          {/* Root Route redirects to /login */}
          <Route path="/" element={<Navigate to="/login" replace />} />

          <Route path="/maintenance" element={<MaintenancePage />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}
