import { LegalFooter } from '../../components/common/LegalFooter'
import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { ShieldCheck, AlertCircle, Loader2, KeyRound } from 'lucide-react'
import { OTPInput } from '../../components/common/OTPInput'
import { translations } from '../../i18n'
import { clearTwoFactorCredentials, getTwoFactorCredentials } from '../../auth/pendingCredentials'

export function TwoFactorCard() {
  const t = translations
  const navigate = useNavigate()
  const [pendingData] = useState(() => getTwoFactorCredentials() ?? { email: '', password: '' })

  useEffect(() => {
    if (!pendingData.email || !pendingData.password) navigate('/login', { replace: true })
  }, [navigate, pendingData.email, pendingData.password])

  const [code, setCode] = useState('')
  const [verifying, setVerifying] = useState(false)
  const [wrongCode, setWrongCode] = useState(false)
  const [serviceError, setServiceError] = useState<string | null>(null)
  const [showBackupModal, setShowBackupModal] = useState(false)
  const [backupCode, setBackupCode] = useState('')
  const [backupError, setBackupError] = useState(false)

  const cleanCode = code.replace(/\s/g, '')
  const isComplete = cleanCode.length === 6

  // Handle TOTP verification
  const handleVerify = async (codeToVerify?: string) => {
    const finalCode = (codeToVerify || code).replace(/\s/g, '')
    if (finalCode.length !== 6 || verifying || !pendingData.email || !pendingData.password) return

    setVerifying(true)
    setWrongCode(false)
    setServiceError(null)

    try {
      // In production/local backend, submit to /api/auth/login with totp_code
      const payload = {
        email: pendingData.email,
        password: pendingData.password,
        totp_code: finalCode,
      }

      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (res.ok) {
        const data = await res.json()
        if (typeof data.access_token !== 'string') throw new Error('Missing access token')
        localStorage.setItem('autowallet_token', data.access_token)
        clearTwoFactorCredentials()
        navigate('/maintenance')
      } else if (res.status === 401) {
        setWrongCode(true)
      } else if (res.status === 503) {
        setServiceError(t.serviceUnavailable)
      } else {
        setWrongCode(true)
      }
    } catch {
      setServiceError(t.serviceUnavailable)
    } finally {
      setVerifying(false)
    }
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    handleVerify()
  }

  const handleLogout = () => {
    clearTwoFactorCredentials()
    navigate('/login')
  }

  const handleBackupSubmit = (e: FormEvent) => {
    e.preventDefault()
    const cleanBackup = backupCode.trim().replace(/-/g, '')
    setBackupError(cleanBackup.length < 8)
    if (cleanBackup.length >= 8) setServiceError(t.serviceUnavailable)
  }

  if (!pendingData.email || !pendingData.password) return null

  return (
    <main className="w-full flex-1 flex flex-col items-center justify-center px-4 py-3 sm:py-5 z-10">
      {/* 440px Centered White Card per Figma A4 (#115:658) */}
      <div className="w-full max-w-[440px] bg-white rounded-2xl border border-[#DDE3EA] p-6 sm:p-9 shadow-[0_8px_24px_-4px_rgba(27,36,50,0.08),0_2px_6px_-1px_rgba(27,36,50,0.04)] transition-all">
        {/* Shield Icon container (Figma EL-f775418e) */}
        <div className="w-12 h-12 rounded-full bg-[#ECEEFA] flex items-center justify-center mb-5 text-[#5A64B4]">
          <ShieldCheck className="w-6 h-6" />
        </div>

        {/* Card Heading */}
        <div className="mb-6 space-y-1">
          <h1 className="text-2xl font-semibold text-[#1A2330] tracking-tight">
            {t.twoFactorTitle}
          </h1>
          <p className="text-[15px] text-[#5E6B7E] leading-relaxed">
            {t.twoFactorSubtitle}
          </p>
        </div>

        {/* Backend service down notice (if applicable) */}
        {serviceError && (
          <div
            role="alert"
            className="mb-5 p-3.5 rounded-xl bg-[#FFF5F5] border border-[#FFD2D2] text-[#C62F31] text-sm flex items-start gap-3 animate-in fade-in"
          >
            <AlertCircle className="w-5 h-5 shrink-0 text-[#C62F31] mt-0.5" />
            <div className="flex-1 leading-snug">
              <span>{serviceError}</span>
            </div>
          </div>
        )}

        {/* 2FA Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-[#1A2330]">
              {t.twoFactorCodeLabel}
            </label>

            {/* 6-cell OTP Input */}
            <OTPInput
              value={code}
              onChange={(val) => {
                setCode(val)
                if (wrongCode) setWrongCode(false)
              }}
              disabled={verifying}
              hasError={wrongCode}
              onComplete={(completedCode) => handleVerify(completedCode)}
              autoFocus
            />

            {/* Wrong Code Error Banner per Figma EL-df39dd6a */}
            {wrongCode && (
              <div
                role="alert"
                className="flex items-start gap-2 text-xs text-[#B42325] mt-2 animate-in fade-in"
              >
                <AlertCircle className="w-4 h-4 shrink-0 text-[#B42325] mt-0.5" />
                <span className="leading-snug">{t.twoFactorWrongCode}</span>
              </div>
            )}
          </div>

          {/* Continue / Checking Button */}
          <button
            type="submit"
            disabled={!isComplete || verifying}
            className="w-full h-11 sm:h-12 px-4 rounded-[10px] bg-[#5A64B4] hover:bg-[#4A53A0] active:bg-[#3F4789] disabled:opacity-45 disabled:cursor-not-allowed text-white font-medium text-sm transition flex items-center justify-center gap-2 cursor-pointer shadow-xs"
          >
            {verifying ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>{t.twoFactorChecking}</span>
              </>
            ) : (
              t.continueButton
            )}
          </button>
        </form>

        {/* Secondary Links ("other" frame #115:702 / #115:761) */}
        <div className="mt-6 flex items-center justify-between text-sm text-[#4A53A0] pt-2">
          <button
            type="button"
            onClick={() => setShowBackupModal(true)}
            className="text-[#4A53A0] hover:text-[#3B495D] hover:underline font-medium cursor-pointer"
          >
            {t.twoFactorCantUseApp}
          </button>
          <button
            type="button"
            onClick={handleLogout}
            className="text-[#4A53A0] hover:text-[#3B495D] hover:underline font-medium cursor-pointer"
          >
            {t.twoFactorLogOut}
          </button>
        </div>
      </div>

      {/* Backup Code Modal */}
      {showBackupModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-[#1A2330]/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
        >
          <div className="w-full max-w-[420px] bg-white rounded-2xl border border-[#DDE3EA] p-6 sm:p-8 shadow-2xl space-y-4">
            <div className="w-10 h-10 rounded-full bg-[#ECEEFA] flex items-center justify-center text-[#5A64B4]">
              <KeyRound className="w-5 h-5" />
            </div>

            <div className="space-y-1">
              <h2 className="text-xl font-semibold text-[#1A2330]">
                {t.twoFactorBackupTitle}
              </h2>
              <p className="text-xs sm:text-sm text-[#5E6B7E] leading-relaxed">
                {t.twoFactorBackupSubtitle}
              </p>
            </div>

            <form onSubmit={handleBackupSubmit} className="space-y-4 pt-2">
              <div className="space-y-1.5">
                {serviceError && <p role="alert" className="text-xs text-[#C62F31]">{serviceError}</p>}
                <input
                  type="text"
                  autoFocus
                  placeholder={t.twoFactorBackupPlaceholder}
                  value={backupCode}
                  onChange={(e) => {
                    setBackupCode(e.target.value.toUpperCase())
                    if (backupError) setBackupError(false)
                  }}
                  className={`w-full h-11 px-3.5 rounded-[10px] border font-mono text-center text-base tracking-widest bg-white text-[#1A2330] placeholder:text-[#8C9BAE] focus:outline-none transition ${
                    backupError
                      ? 'border-[#B42325] text-[#B42325] focus:ring-2 focus:ring-[#B42325]/20'
                      : 'border-[#DDE3EA] focus:border-[#5A64B4] focus:ring-2 focus:ring-[#5A64B4]/20'
                  }`}
                />
                {backupError && (
                  <p className="text-xs text-[#B42325] flex items-center gap-1 mt-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>Please enter a valid 8-character recovery code.</span>
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-2 pt-2">
                <button
                  type="submit"
                  disabled={backupCode.trim().length < 8}
                  className="w-full h-11 rounded-[10px] bg-[#5A64B4] hover:bg-[#4A53A0] disabled:opacity-50 text-white font-medium text-sm transition cursor-pointer"
                >
                  {t.twoFactorBackupSubmit}
                </button>
                <button
                  type="button"
                  onClick={() => setShowBackupModal(false)}
                  className="w-full h-10 rounded-[10px] text-sm text-[#5E6B7E] hover:text-[#1A2330] transition cursor-pointer"
                >
                  {t.twoFactorBackToCode}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Legal Footer (Figma EL-0b7a78e5) */}
      <LegalFooter t={t} />
    </main>
  )
}
