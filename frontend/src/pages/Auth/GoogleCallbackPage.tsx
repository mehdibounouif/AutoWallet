import { useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Loader2, AlertCircle } from 'lucide-react'
import { translations } from '../../i18n'
import { TopBar } from '../../components/common/TopBar'

interface ExchangeResult {
  ok: boolean
  data: { access_token?: unknown; detail?: unknown }
}

export function GoogleCallbackPage() {
  const t = translations
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const exchangeRef = useRef<{ code: string; promise: Promise<ExchangeResult> } | null>(null)

  useEffect(() => {
    const code = searchParams.get('code')
    const error = searchParams.get('error')
    const email = searchParams.get('email')
    const status = searchParams.get('status')

    // Handled cancelled or access_denied from Google
    if (error === 'access_denied' || error === 'cancelled' || status === 'cancelled') {
      navigate('/login?google_status=cancelled', { replace: true })
      return
    }

    // Handled existing password status redirect
    if (status === 'existing_password') {
      const emailQuery = email ? `&email=${encodeURIComponent(email)}` : ''
      navigate(`/login?google_status=existing_password${emailQuery}`, { replace: true })
      return
    }

    if (!code) {
      // If visited without parameters, return to login
      navigate('/login', { replace: true })
      return
    }

    let isMounted = true

    // Reuse the one-time code exchange when Strict Mode reruns this effect.
    if (exchangeRef.current?.code !== code) {
      exchangeRef.current = {
        code,
        promise: fetch(`/api/auth/oauth/google/callback?code=${encodeURIComponent(code)}`)
          .then(async (res) => ({ ok: res.ok, data: await res.json().catch(() => ({})) })),
      }
    }
    const exchangePromise = exchangeRef.current.promise

    const exchangeCode = async () => {
      try {
        const result = await exchangePromise

        if (!isMounted) return

        if (result.ok) {
          if (typeof result.data.access_token !== 'string') throw new Error('Missing access token')
          localStorage.setItem('autowallet_token', result.data.access_token)
          navigate('/maintenance', { replace: true })
        } else {
          const detail = typeof result.data.detail === 'string'
            ? result.data.detail.toLowerCase()
            : ''

          if (detail.includes('already has a password') || detail.includes('existing')) {
            const emailQuery = email ? `&email=${encodeURIComponent(email)}` : ''
            navigate(`/login?google_status=existing_password${emailQuery}`, { replace: true })
          } else {
            navigate('/login?google_status=cancelled', { replace: true })
          }
        }
      } catch {
        if (!isMounted) return
        setErrorMessage(t.serviceUnavailable)
      }
    }

    exchangeCode()

    return () => {
      isMounted = false
    }
  }, [navigate, searchParams, t.serviceUnavailable])

  return (
    <div className="min-h-screen w-full bg-[#F3F6FA] flex flex-col">
      <TopBar />

      <main className="w-full flex-1 flex flex-col items-center justify-center px-4 py-3 sm:py-5 z-10">
        <div className="w-full max-w-[440px] bg-white rounded-2xl border border-[#DDE3EA] p-8 sm:p-10 shadow-[0_8px_24px_-4px_rgba(27,36,50,0.08),0_2px_6px_-1px_rgba(27,36,50,0.04)] text-center flex flex-col items-center">
          {errorMessage ? (
            <>
              <div
                role="alert"
                className="w-full mb-6 p-3.5 rounded-xl bg-[#FFF5F5] border border-[#FFD2D2] text-[#C62F31] text-sm flex items-start gap-3 text-left"
              >
                <AlertCircle className="w-5 h-5 shrink-0 text-[#C62F31] mt-0.5" />
                <div className="flex-1 leading-snug">{errorMessage}</div>
              </div>
              <div className="flex flex-col gap-2.5 w-full">
                <button
                  type="button"
                  onClick={() => navigate('/login?google_status=cancelled')}
                  className="w-full h-11 px-4 rounded-[10px] border border-[#DDE3EA] bg-white hover:bg-[#F3F6FA] text-[#3B495D] font-medium text-sm transition cursor-pointer"
                >
                  {t.googleCancel}
                </button>
              </div>
            </>
          ) : (
            <>
              <div
                role="status"
                aria-label={t.googleSigningIn}
                className="w-12 h-12 rounded-full bg-[#ECEEFA] flex items-center justify-center mb-4"
              >
                <Loader2 className="w-6 h-6 text-[#5A64B4] animate-spin" />
              </div>
              <h1 className="text-2xl font-semibold text-[#1A2330] tracking-tight mb-2">
                {t.googleSigningIn}
              </h1>
              <p className="text-[15px] text-[#5E6B7E] leading-relaxed max-w-[320px]">
                {t.loginSubtitle}
              </p>
            </>
          )}
        </div>
      </main>
    </div>
  )
}
