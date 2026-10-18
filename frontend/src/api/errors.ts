// Read field errors without retaining FastAPI's echoed input (which can include secrets).
export function apiValidationErrors(payload: unknown): { field: string; message: string }[] {
  const detail = payload && typeof payload === 'object' && 'detail' in payload ? payload.detail : null
  if (!Array.isArray(detail)) return []
  return detail.flatMap((item: unknown) => {
    if (!item || typeof item !== 'object' || !('msg' in item) || typeof item.msg !== 'string' || !item.msg) return []
    const location = 'loc' in item && Array.isArray(item.loc) ? item.loc : []
    const field = location.find((part: unknown) => typeof part === 'string' && part !== 'body')
    return [{ field: typeof field === 'string' ? field : '', message: item.msg }]
  })
}

// FastAPI returns string, structured, or field-validation details.
// Proxies can also return null, HTML, or another shape; retain a useful fallback.
export function apiErrorDetail(payload: unknown, fallback: string): { message: string; code: string | null } {
  const detail: unknown = payload && typeof payload === 'object' && 'detail' in payload ? payload.detail : null
  if (Array.isArray(detail)) {
    const labels: Record<string, string> = { full_name: 'Full name', email: 'Email', password: 'Password', bank_account_id: 'Bank account' }
    const message = apiValidationErrors(payload).map(error => `${labels[error.field] ?? error.field.replaceAll('_', ' ')}: ${error.message}`).join(' ')
    return { message: message || fallback, code: null }
  }
  if (typeof detail === 'string') return { message: detail || fallback, code: null }
  if (detail && typeof detail === 'object' && !Array.isArray(detail)) {
    return {
      message: 'message' in detail && typeof detail.message === 'string' && detail.message ? detail.message : fallback,
      code: 'code' in detail && typeof detail.code === 'string' ? detail.code : null,
    }
  }
  return { message: fallback, code: null }
}
