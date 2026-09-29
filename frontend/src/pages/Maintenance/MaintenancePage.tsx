import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ShieldCheck } from 'lucide-react'
import { getTranslations } from '../../i18n'
import type { Language } from '../../i18n'

export function MaintenancePage({ currentLang }: { currentLang: Language }) {
  const navigate = useNavigate()
  const t = getTranslations(currentLang)
  const [status, setStatus] = useState<'checking' | 'authenticated' | 'error'>('checking')

  useEffect(() => {
    const token = localStorage.getItem('autowallet_token')
    if (!token) {
      navigate('/login', { replace: true })
      return
    }

    const controller = new AbortController()
    fetch('/api/auth/me', {
      headers: { Authorization: `Bearer ${token}` },
      signal: controller.signal,
    })
      .then((response) => {
        if (response.ok) setStatus('authenticated')
        else if (response.status === 401 || response.status === 403) {
          localStorage.removeItem('autowallet_token')
          navigate('/session-ended', { replace: true })
        } else setStatus('error')
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === 'AbortError') return
        setStatus('error')
      })

    return () => controller.abort()
  }, [navigate])

  if (status === 'checking') {
    return <div role="status" className="min-h-screen flex items-center justify-center">{t.twoFactorChecking}</div>
  }

  return (
    <div className="min-h-screen w-full bg-[#F3F6FA] flex flex-col items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-2xl border border-[#DDE3EA] p-8 sm:p-10 shadow-sm text-center space-y-4">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-[#ECEEFA] flex items-center justify-center text-[#5A64B4]">
          <ShieldCheck className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold text-[#1A2330]">{t.dashboardPreviewTitle}</h1>
        <p className="text-sm text-[#5E6B7E] leading-relaxed">
          {status === 'error' ? t.serviceUnavailable : t.dashboardPreviewBody}
        </p>
        <div className="pt-2 flex flex-col gap-2">
          <button
            type="button"
            onClick={() => {
              localStorage.removeItem('autowallet_token')
              navigate('/login')
            }}
            className="w-full h-11 rounded-[10px] bg-[#5A64B4] hover:bg-[#4A53A0] text-white text-sm font-medium transition cursor-pointer"
          >
            {t.backToAuthScreen}
          </button>
        </div>
      </div>
    </div>
  )
}
