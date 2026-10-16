// Keep timeouts consistent while allowing callers to cancel on navigation.
// A timeout does not confirm whether a write reached the server.
export function apiFetch(input: RequestInfo | URL, options: RequestInit = {}, timeoutMs = 30000) {
  const timeout = AbortSignal.timeout(timeoutMs)
  return fetch(input, {
    ...options,
    signal: options.signal ? AbortSignal.any([options.signal, timeout]) : timeout,
  })
}
