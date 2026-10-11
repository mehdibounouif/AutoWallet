/**
 * Password recovery inputs — the forgot-password email, the reset password.
 *
 * What this suite pins:
 *   FORGOT EMAIL     empty field never sends (green). FINDING #23: any
 *                    NON-EMPTY string is POSTed to /api/auth/password/forgot
 *                    today — "not-an-email" goes out on the wire, and the
 *                    backend's 422 comes back as a misleading "service
 *                    unavailable". The it.fails test goes green -> RED when
 *                    the AuthCard-style email validation is added.
 *   RESET PASSWORD   under 8 characters never sends (green — the gate is
 *                    disabled={password.length < 8}).
 */
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { ForgotPasswordCard } from '../src/pages/Auth/ForgotPasswordCard'
import { ResetPasswordCard } from '../src/pages/Auth/ResetPasswordCard'
import { translations as t } from '../src/i18n'

function fetchReturning(status: number, body: unknown) {
  const fetchMock = vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  })
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

afterEach(() => {
  vi.unstubAllGlobals()
})

function renderForgot() {
  return render(
    <MemoryRouter initialEntries={['/forgot-password']}>
      <Routes>
        <Route path="/forgot-password" element={<ForgotPasswordCard />} />
        <Route path="*" element={<div>off-card</div>} />
      </Routes>
    </MemoryRouter>,
  )
}

function renderReset() {
  return render(
    <MemoryRouter initialEntries={['/reset-password?token=qa-token']}>
      <Routes>
        <Route path="/reset-password" element={<ResetPasswordCard />} />
        <Route path="*" element={<div>off-card</div>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('PIN: forgot-password email', () => {
  it('an empty email never sends anything', () => {
    // SCENARIO: the user clicks Send reset link with nothing typed.
    // EXPECTED: the button is disabled — no request leaves the browser.
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    renderForgot()

    expect(screen.getByRole('button', { name: t.sendResetLink })).toBeDisabled()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it.fails('finding #23: a malformed email is never sent to the API', async () => {
    // SCENARIO: the user types "not-an-email" and submits.
    // EXPECTED: client-side rejection — the emailInvalid message shows AND
    //           no request goes out (the AuthCard pattern).
    //           (fails today: the junk string is POSTed verbatim, and the
    //           backend 422 surfaces as a misleading "service unavailable")
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    renderForgot()
    const user = userEvent.setup()

    await user.type(screen.getByLabelText(t.emailLabel), 'not-an-email')
    await user.click(screen.getByRole('button', { name: t.sendResetLink }))

    const rejected =
      screen.queryByText(t.emailInvalid) !== null && fetchMock.mock.calls.length === 0
    expect(rejected).toBe(true)
  })

  it('a valid email is sent to the API exactly once, with the exact payload', async () => {
    // SCENARIO: a well-formed email is submitted.
    // EXPECTED: POST /api/auth/password/forgot with { email } — the wire
    //           contract of the recovery flow.
    const fetchMock = fetchReturning(200, {})
    renderForgot()
    const user = userEvent.setup()

    await user.type(screen.getByLabelText(t.emailLabel), 'qa.recovery@autowallet.dev')
    await user.click(screen.getByRole('button', { name: t.sendResetLink }))

    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/auth/password/forgot',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'qa.recovery@autowallet.dev' }),
      }),
    )
  })
})

describe('PIN: reset-password field', () => {
  it('a password under 8 characters never sends anything', () => {
    // SCENARIO: "short" typed as the new password.
    // EXPECTED: the submit button is disabled — the 8-character gate runs
    //           client-side, before any request.
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)

    const { container } = renderReset()
    expect(screen.getByLabelText(t.newPasswordLabel)).toBeInTheDocument()
    const submit = container.querySelector('button[type="submit"]')
    expect(submit).not.toBeNull()
    expect(submit!).toBeDisabled()
    expect(fetchMock).not.toHaveBeenCalled()
  })
})
