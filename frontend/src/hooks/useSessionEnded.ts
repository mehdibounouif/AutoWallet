import { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { SessionEndedError } from '../api/client'

/** Returns a checker for API errors: if the session ended, it opens /session-ended and returns true. */
export function useSessionEnded() {
  const navigate = useNavigate()
  return useCallback(
    (error: unknown) => {
      if (!(error instanceof SessionEndedError)) return false
      navigate('/session-ended', { replace: true })
      return true
    },
    [navigate],
  )
}
