import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Download, Mail, ShieldCheck, Trash2 } from 'lucide-react'
import { AccountLayout } from '../../components/account/AccountLayout'
import { OTPInput } from '../../components/common/OTPInput'
import { ApiError, apiFetch, apiJson, clearToken, downloadFile } from '../../api/client'
import { useCountdown } from '../../hooks/useCountdown'
import { useSessionEnded } from '../../hooks/useSessionEnded'

const CONTACT_EMAIL = 'mohamedamintarza@gmail.com'
const RESEND_WAIT_SECONDS = 60 // the API's wait between two codes (backend/app/gdpr/router.py)

interface Me {
  email: string
}

interface Note {
  ok: boolean
  text: string
}

function errorText(error: unknown): string {
  return error instanceof ApiError ? error.message : 'AutoWallet cannot be reached right now. Please try again.'
}

export function PrivacyDataPage() {
  const sessionEnded = useSessionEnded()
  const [email, setEmail] = useState<string | null>(null)
  const [downloading, setDownloading] = useState<'json' | 'csv' | null>(null)
  const [downloadNote, setDownloadNote] = useState<Note | null>(null)
  const [step, setStep] = useState<'start' | 'code-sent' | 'deleted'>('start')
  const [code, setCode] = useState('')
  const [wrongCode, setWrongCode] = useState(false)
  const [working, setWorking] = useState(false)
  const [deleteNote, setDeleteNote] = useState<Note | null>(null)
  const { countdown, startCountdown } = useCountdown()

  useEffect(() => {
    const controller = new AbortController()
    apiJson<Me>('/api/auth/me', { signal: controller.signal })
      .then((me) => setEmail(me.email))
      .catch((error: unknown) => {
        if (!controller.signal.aborted) sessionEnded(error)
      })
    return () => controller.abort()
  }, [sessionEnded])

  async function download(format: 'json' | 'csv') {
    setDownloading(format)
    setDownloadNote(null)
    try {
      await downloadFile(`/api/gdpr/export?format=${format}`, format === 'json' ? 'autowallet-data.json' : 'autowallet-data.zip')
      setDownloadNote({ ok: true, text: 'Your download has started. We also sent you an email about this export.' })
    } catch (error) {
      if (!sessionEnded(error)) setDownloadNote({ ok: false, text: errorText(error) })
    } finally {
      setDownloading(null)
    }
  }

  async function sendCode() {
    setWorking(true)
    setDeleteNote(null)
    try {
      const response = await apiFetch('/api/gdpr/delete-request', { method: 'POST' })
      const body = (await response.json()) as { message: string }
      setStep('code-sent')
      setCode('')
      setWrongCode(false)
      startCountdown(RESEND_WAIT_SECONDS)
      setDeleteNote({ ok: true, text: body.message })
    } catch (error) {
      if (!sessionEnded(error)) setDeleteNote({ ok: false, text: errorText(error) })
    } finally {
      setWorking(false)
    }
  }

  async function deleteAccount() {
    if (!/^\d{6}$/.test(code)) {
      setWrongCode(true)
      setDeleteNote({ ok: false, text: 'Enter the 6-digit code from the email.' })
      return
    }
    setWorking(true)
    setDeleteNote(null)
    try {
      await apiFetch('/api/gdpr/delete-confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      })
      clearToken()
      setStep('deleted')
    } catch (error) {
      if (sessionEnded(error)) return
      const reason = error instanceof ApiError ? error.code : undefined
      if (reason === 'no_code' || reason === 'too_many_tries') setStep('start') // this code cannot work any more
      setWrongCode(reason === 'wrong_code')
      setDeleteNote({ ok: false, text: errorText(error) })
    } finally {
      setWorking(false)
    }
  }

  if (step === 'deleted') {
    return (
      <div className="min-h-screen w-full bg-[#F3F6FA] flex items-center justify-center px-4">
        <div className="max-w-md w-full space-y-4 rounded-2xl border border-[#DDE3EA] bg-white p-8 sm:p-10 text-center shadow-sm">
          <span className="mx-auto flex w-14 h-14 items-center justify-center rounded-2xl bg-[#ECEEFA] text-[#5A64B4]">
            <ShieldCheck className="w-8 h-8" aria-hidden="true" />
          </span>
          <h1 className="text-2xl font-bold text-[#1A2330]">Your account was deleted</h1>
          <p className="text-sm leading-relaxed text-[#5E6B7E]">
            Your profile, envelopes, rules and payment history are gone from AutoWallet. We sent you a last email to
            confirm it. Thank you for trying AutoWallet.
          </p>
          <Link
            to="/login"
            className="flex h-11 w-full items-center justify-center rounded-[10px] bg-[#5A64B4] text-sm font-medium text-white hover:bg-[#4A53A0] transition"
          >
            Back to the login page
          </Link>
        </div>
      </div>
    )
  }

  return (
    <AccountLayout title="Privacy & data" subtitle="Your data belongs to you: take a copy of it, or delete it with your account.">
      <div className="mx-auto max-w-3xl space-y-6">
        <section aria-labelledby="download-title" className="rounded-2xl border border-[#DDE3EA] bg-white p-6 sm:p-8 shadow-sm">
          <h2 id="download-title" className="text-lg font-semibold text-[#1A2330]">
            Download your data
          </h2>
          <p className="mt-2 text-sm leading-6 text-[#3B495D]">
            Get a copy of everything AutoWallet keeps about you: your profile, your envelopes and their balances, your
            rules and your payment history. JSON is one file that other apps can read; CSV is a zip of spreadsheets.
          </p>
          {email && <p className="mt-2 text-sm text-[#5E6B7E]">Signed in as {email}</p>}
          <div className="mt-5 flex flex-wrap gap-3">
            {(['json', 'csv'] as const).map((format) => (
              <button
                key={format}
                type="button"
                onClick={() => download(format)}
                disabled={downloading !== null}
                className="inline-flex items-center gap-2 h-11 px-4 rounded-[10px] border border-[#DDE3EA] bg-white text-sm font-medium text-[#1A2330] hover:bg-[#F3F6FA] transition cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Download className="w-4 h-4" aria-hidden="true" />
                {downloading === format ? 'Preparing…' : format === 'json' ? 'Download JSON' : 'Download CSV (zip)'}
              </button>
            ))}
          </div>
          {downloadNote && <NoteLine note={downloadNote} />}
        </section>

        <section aria-labelledby="delete-title" className="rounded-2xl border border-[#F3C7C8] bg-white p-6 sm:p-8 shadow-sm">
          <h2 id="delete-title" className="text-lg font-semibold text-[#1A2330]">
            Delete your account
          </h2>
          <p className="mt-2 text-sm leading-6 text-[#3B495D]">
            This permanently deletes your AutoWallet account: your profile, envelopes, rules and payment history. It
            cannot be undone. To make sure it is you, we send a 6-digit code to {email ?? 'your email address'}.
          </p>

          {step === 'start' ? (
            <button
              type="button"
              onClick={sendCode}
              disabled={working}
              className="mt-5 inline-flex items-center gap-2 h-11 px-4 rounded-[10px] border border-[#C62F31] text-sm font-medium text-[#C62F31] hover:bg-[#FFF5F5] transition cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Mail className="w-4 h-4" aria-hidden="true" />
              {working ? 'Sending…' : 'Email me a deletion code'}
            </button>
          ) : (
            <div className="mt-5 space-y-4">
              <div role="group" aria-label="Deletion code from the email" className="max-w-sm">
                <OTPInput
                  value={code}
                  onChange={(value) => {
                    setCode(value)
                    if (wrongCode) setWrongCode(false)
                  }}
                  disabled={working}
                  hasError={wrongCode}
                />
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={deleteAccount}
                  disabled={working}
                  className="inline-flex items-center gap-2 h-11 px-4 rounded-[10px] bg-[#C62F31] hover:bg-[#B02527] text-sm font-medium text-white transition cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Trash2 className="w-4 h-4" aria-hidden="true" />
                  {working ? 'Deleting…' : 'Delete my account forever'}
                </button>
                <button
                  type="button"
                  onClick={sendCode}
                  disabled={working || countdown > 0}
                  className="h-11 px-3 rounded-[10px] text-sm font-medium text-[#4A53A0] hover:bg-[#ECEEFA] transition cursor-pointer disabled:cursor-not-allowed disabled:text-[#7A879B] disabled:hover:bg-transparent"
                >
                  {countdown > 0 ? `Send a new code in ${countdown} s` : 'Send a new code'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setStep('start')
                    setDeleteNote(null)
                  }}
                  disabled={working}
                  className="h-11 px-3 rounded-[10px] text-sm font-medium text-[#5E6B7E] hover:bg-[#F3F6FA] transition cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
          {deleteNote && <NoteLine note={deleteNote} />}
        </section>

        <p className="text-sm leading-6 text-[#5E6B7E]">
          You can also ask us to correct your data or answer your questions about it: write to{' '}
          <a href={`mailto:${CONTACT_EMAIL}`} className="font-medium text-[#4A53A0] hover:underline">
            {CONTACT_EMAIL}
          </a>
          . Read the{' '}
          <Link to="/privacy" className="font-medium text-[#4A53A0] hover:underline">
            Privacy Policy
          </Link>{' '}
          to see what we keep and why.
        </p>
      </div>
    </AccountLayout>
  )
}

function NoteLine({ note }: { note: Note }) {
  return (
    <p role={note.ok ? 'status' : 'alert'} className={`mt-4 text-sm ${note.ok ? 'text-[#1F7A3A]' : 'text-[#B02527]'}`}>
      {note.text}
    </p>
  )
}
