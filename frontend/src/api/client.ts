// Calls to the AutoWallet API from signed-in pages: the token, the errors, the downloads.

const TOKEN_KEY = 'autowallet_token'

/** The token is missing or expired: the user must log in again. */
export class SessionEndedError extends Error {
  constructor() {
    super('Your session has ended. Please log in again.')
    this.name = 'SessionEndedError'
  }
}

/** The API answered with an error. `message` is ready to show to the user. */
export class ApiError extends Error {
  status: number
  code?: string

  constructor(status: number, message: string, code?: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
  }
}

export function getToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

export function clearToken() {
  try {
    localStorage.removeItem(TOKEN_KEY)
  } catch {
    // Browser storage can be unavailable; there is nothing to clear then.
  }
}

async function toApiError(response: Response): Promise<ApiError> {
  const body: unknown = await response.json().catch(() => null)
  const detail = body && typeof body === 'object' && 'detail' in body ? body.detail : null

  // Our endpoints send {code, message}; FastAPI's own errors send a string.
  if (detail && typeof detail === 'object' && 'message' in detail && typeof detail.message === 'string') {
    const code = 'code' in detail && typeof detail.code === 'string' ? detail.code : undefined
    return new ApiError(response.status, detail.message, code)
  }
  if (typeof detail === 'string') return new ApiError(response.status, detail)
  if (response.status === 422) return new ApiError(422, 'Some values are not valid. Check them and try again.')
  return new ApiError(response.status, 'Something went wrong. Please try again later.')
}

/** fetch() with the user's token. A 401 becomes SessionEndedError, any other error an ApiError. */
export async function apiFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const token = getToken()
  if (!token) throw new SessionEndedError()

  const headers = new Headers(init.headers)
  headers.set('Authorization', `Bearer ${token}`)
  const response = await fetch(path, { ...init, headers })

  if (response.status === 401) {
    clearToken()
    throw new SessionEndedError()
  }
  if (!response.ok) throw await toApiError(response)
  return response
}

export async function apiJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await apiFetch(path, init)
  return (await response.json()) as T
}

/** Downloads a file from the API and lets the browser save it, under the name the server suggests. */
export async function downloadFile(path: string, fallbackName: string) {
  const response = await apiFetch(path)
  const blob = await response.blob()
  const disposition = response.headers.get('Content-Disposition') ?? ''
  const name = /filename="([^"]+)"/.exec(disposition)?.[1] ?? fallbackName

  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = name
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 10_000)
}
