export function safeReturnPath(requestedPath: string | null): string {
  if (!requestedPath?.startsWith('/') || requestedPath.startsWith('//') || requestedPath.includes('\\')) {
    return '/dashboard'
  }
  try {
    const url = new URL(requestedPath, window.location.origin)
    if (url.origin !== window.location.origin) return '/dashboard'
    return `${url.pathname}${url.search}${url.hash}`
  } catch {
    return '/dashboard'
  }
}
