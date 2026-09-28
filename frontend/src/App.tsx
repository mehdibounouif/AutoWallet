import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import type { Language } from './i18n'
import { AuthPage } from './pages/Auth/AuthPage'
import { GoogleCallbackPage } from './pages/Auth/GoogleCallbackPage'
import { OnboardingPage } from './pages/Onboarding/OnboardingPage'
import { MaintenancePage } from './pages/Maintenance/MaintenancePage'

export default function App() {
  const [currentLang, setCurrentLang] = useState<Language>('EN')

  const handleSelectLang = (lang: string) => {
    const code = (lang || 'EN').toUpperCase() as Language
    setCurrentLang(code === 'AR' || code === 'FR' ? code : 'EN')
  }

  // Set html dir attribute for Arabic RTL
  useEffect(() => {
    document.documentElement.dir = currentLang === 'AR' ? 'rtl' : 'ltr'
    document.documentElement.lang = currentLang.toLowerCase()
  }, [currentLang])

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={
            <AuthPage
              mode="login"
              currentLang={currentLang}
              onSelectLang={handleSelectLang}
            />
          }
        />

        {/* Figma A4: Two-factor authentication (2FA) */}
        <Route
          path="/login/2fa"
          element={
            <AuthPage
              mode="2fa"
              currentLang={currentLang}
              onSelectLang={handleSelectLang}
            />
          }
        />

        {/* Figma A5: Session ended */}
        <Route
          path="/session-ended"
          element={
            <AuthPage
              mode="session-ended"
              currentLang={currentLang}
              onSelectLang={handleSelectLang}
            />
          }
        />

        {/* Figma A6: Password reset and email verification */}
        <Route
          path="/forgot-password"
          element={
            <AuthPage
              mode="forgot-password"
              currentLang={currentLang}
              onSelectLang={handleSelectLang}
            />
          }
        />

        <Route
          path="/reset-password"
          element={
            <AuthPage
              mode="reset-password"
              currentLang={currentLang}
              onSelectLang={handleSelectLang}
            />
          }
        />

        <Route
          path="/verify-email"
          element={
            <AuthPage
              mode="verify-email"
              currentLang={currentLang}
              onSelectLang={handleSelectLang}
            />
          }
        />

        <Route
          path="/signup"
          element={
            <AuthPage
              mode="signup"
              currentLang={currentLang}
              onSelectLang={handleSelectLang}
            />
          }
        />

        {/* Figma A3: Continue with Google OAuth Callback */}
        <Route
          path="/auth/google/callback"
          element={
            <GoogleCallbackPage
              currentLang={currentLang}
              onSelectLang={handleSelectLang}
            />
          }
        />

        {/* Figma A7, A8 & A9: Onboarding Routes */}
        <Route
          path="/welcome/about"
          element={
            <OnboardingPage
              initialStep={1}
              currentLang={currentLang}
              onSelectLang={handleSelectLang}
            />
          }
        />

        <Route
          path="/welcome/account"
          element={
            <OnboardingPage
              initialStep={2}
              currentLang={currentLang}
              onSelectLang={handleSelectLang}
            />
          }
        />

        <Route
          path="/welcome/envelopes"
          element={
            <OnboardingPage
              initialStep={3}
              currentLang={currentLang}
              onSelectLang={handleSelectLang}
            />
          }
        />

        <Route
          path="/welcome/rules"
          element={
            <OnboardingPage
              initialStep={4}
              currentLang={currentLang}
              onSelectLang={handleSelectLang}
            />
          }
        />

        <Route
          path="/welcome/try"
          element={
            <OnboardingPage
              initialStep={5}
              currentLang={currentLang}
              onSelectLang={handleSelectLang}
            />
          }
        />

        <Route path="/onboarding" element={<Navigate to="/welcome/about" replace />} />

        {/* Root Route redirects to /login */}
        <Route path="/" element={<Navigate to="/login" replace />} />

        <Route path="/maintenance" element={<MaintenancePage />} />
      </Routes>
    </BrowserRouter>
  )
}
