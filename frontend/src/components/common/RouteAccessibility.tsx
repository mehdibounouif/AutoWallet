import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'

const pageNames: Record<string, string> = {
  '/login': 'Log in', '/signup': 'Create your account', '/login/2fa': 'Two-factor login',
  '/session-ended': 'Session ended', '/forgot-password': 'Forgot password',
  '/reset-password': 'Reset password', '/auth/reset-password': 'Reset password',
  '/verify-email': 'Verify email', '/auth/verify-email': 'Verify email',
  '/auth/google/callback': 'Google sign-in', '/terms': 'Terms', '/privacy': 'Privacy',
  '/dashboard': 'Home', '/welcome/about': 'About you', '/welcome/account': 'Link account',
  '/welcome/envelopes': 'Your envelopes', '/welcome/rules': 'Your rules', '/welcome/try': 'Try a payment',
}

function pageName(path: string) {
  if (pageNames[path]) return pageNames[path]
  const parts = path.split('/').filter(Boolean)
  if (parts[0] !== 'app') return 'AutoWallet'
  if (parts[1] === 'activity' && parts[2]) return 'Payment details'
  if (parts[1] === 'envelopes' && parts[2]) return 'Envelope details'
  if (parts[1] === 'settings' && parts[2]) {
    const section = ({ 'api-keys': 'API keys', privacy: 'Privacy and data' } as Record<string, string>)[parts[2]] ?? parts[2]
    return `${section.charAt(0).toUpperCase()}${section.slice(1)} · Settings`
  }
  const name = parts[1] ?? 'Home'
  return name.charAt(0).toUpperCase() + name.slice(1)
}

function focusMain() {
  const main = document.querySelector('main')
  if (!main) return false
  main.id = 'main-content'
  main.tabIndex = -1
  main.focus({ preventScroll: true })
  return true
}

export function RouteAccessibility() {
  const { pathname } = useLocation()
  const previousPath = useRef(pathname)
  const name = pageName(pathname)
  useEffect(() => {
    document.title = name === 'AutoWallet' ? name : `${name} · AutoWallet`
    if (previousPath.current === pathname) return
    previousPath.current = pathname
    // Preserve search/OTP focus and modal focus. Lazy routes may mount later.
    const moveFocus = () => {
      if (document.querySelector('[role="dialog"], [role="alertdialog"]') || document.activeElement?.matches('input, textarea, select')) return true
      return focusMain()
    }
    let observer: MutationObserver | undefined
    const frame = requestAnimationFrame(() => {
      if (moveFocus()) return
      observer = new MutationObserver(() => { if (moveFocus()) observer?.disconnect() })
      observer.observe(document.body, { childList: true, subtree: true })
    })
    return () => { cancelAnimationFrame(frame); observer?.disconnect() }
  }, [pathname, name])
  return <>
    <a className="skip-link" href="#main-content" onClick={event => { if (focusMain()) event.preventDefault() }}>Skip to main content</a>
    <span className="sr-only" role="status" aria-atomic="true">{name}</span>
  </>
}
