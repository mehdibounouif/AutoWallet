import { lazy, Suspense, useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import type { Language } from './i18n'
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

function getSavedLanguage(): Language {
  try {
    const saved = localStorage.getItem('autowallet_language')
    return saved === 'FR' || saved === 'AR' ? saved : 'EN'
  } catch {
    return 'EN'
  }
}

export default function App() {
  const [currentLang, setCurrentLang] = useState<Language>(getSavedLanguage)

  const handleSelectLang = (lang: string) => {
    const code = (lang || 'EN').toUpperCase() as Language
    setCurrentLang(code === 'AR' || code === 'FR' ? code : 'EN')
  }

  // Set html dir attribute for Arabic RTL
  useEffect(() => {
    document.documentElement.dir = currentLang === 'AR' ? 'rtl' : 'ltr'
    document.documentElement.lang = currentLang.toLowerCase()
    try {
      localStorage.setItem('autowallet_language', currentLang)
    } catch {
      // Language still applies for this visit when storage is unavailable.
    }
  }, [currentLang])

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
                <AuthPage mode={mode} currentLang={currentLang} onSelectLang={handleSelectLang} />
              }
            />
          ))}

          {/* Figma A3: Continue with Google OAuth Callback */}
          <Route
            path="/auth/google/callback"
            element={
              <GoogleCallbackPage currentLang={currentLang} onSelectLang={handleSelectLang} />
            }
          />

          {onboardingPaths.map((path) => (
            <Route
              key={path}
              path={path}
              element={<OnboardingPage currentLang={currentLang} onSelectLang={handleSelectLang} />}
            />
          ))}

          <Route path="/onboarding" element={<Navigate to="/welcome/about" replace />} />

          {/* Root Route redirects to /login */}
          <Route path="/" element={<Navigate to="/login" replace />} />

          <Route path="/maintenance" element={<MaintenancePage currentLang={currentLang} />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}
