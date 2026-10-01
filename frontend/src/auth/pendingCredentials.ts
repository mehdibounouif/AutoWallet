interface Credentials {
  email: string
  password: string
}

let signupCredentials: Credentials | null = null
let twoFactorCredentials: Credentials | null = null

export function setSignupCredentials(credentials: Credentials) {
  signupCredentials = credentials
}

export function getSignupPassword(email: string) {
  return signupCredentials?.email === email ? signupCredentials.password : null
}

export function clearSignupCredentials() {
  signupCredentials = null
}

export function setTwoFactorCredentials(credentials: Credentials) {
  twoFactorCredentials = credentials
}

export function getTwoFactorCredentials() {
  return twoFactorCredentials
}

export function clearTwoFactorCredentials() {
  twoFactorCredentials = null
}

// Remove passwords left in session storage by older versions of the frontend.
export function clearStoredPasswords() {
  try {
    sessionStorage.removeItem('autowallet_2fa_pending')
    const storedDraft = sessionStorage.getItem('autowallet_signup_draft')
    if (!storedDraft) return

    const draft: unknown = JSON.parse(storedDraft)
    if (!draft || typeof draft !== 'object' || Array.isArray(draft)) {
      sessionStorage.removeItem('autowallet_signup_draft')
      return
    }

    if ('password' in draft) {
      delete draft.password
      sessionStorage.setItem('autowallet_signup_draft', JSON.stringify(draft))
    }
  } catch {
    try {
      sessionStorage.removeItem('autowallet_signup_draft')
    } catch {
      // Browser storage can be unavailable; the signup flow still works in memory.
    }
  }
}
