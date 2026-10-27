import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { getLanguage, setLanguage, translations, useTranslation } from '../src/i18n'
import { LanguageSelector } from '../src/components/ui/LanguageSelector'

function TranslationConsumer() {
  const { t, lang, isRtl } = useTranslation()
  return (
    <div>
      <span data-testid="current-lang">{lang}</span>
      <span data-testid="is-rtl">{isRtl ? 'true' : 'false'}</span>
      <span data-testid="login-title">{t.loginTitle}</span>
      <span data-testid="proxy-login-title">{translations.loginTitle}</span>
      <span data-testid="envelopes-title">{t.envelopesMainHeading}</span>
      <span data-testid="rent-name">{t.envNameRent}</span>
    </div>
  )
}

describe('i18n, RTL and LanguageSelector', () => {
  beforeEach(() => {
    localStorage.clear()
    setLanguage('en')
  })

  afterEach(() => {
    localStorage.clear()
    setLanguage('en')
  })

  it('defaults to English with LTR direction', () => {
    render(<TranslationConsumer />)
    expect(screen.getByTestId('current-lang')).toHaveTextContent('en')
    expect(screen.getByTestId('is-rtl')).toHaveTextContent('false')
    expect(screen.getByTestId('login-title')).toHaveTextContent('Log in')
    expect(screen.getByTestId('proxy-login-title')).toHaveTextContent('Log in')
    expect(screen.getByTestId('envelopes-title')).toHaveTextContent('Envelopes')
    expect(screen.getByTestId('rent-name')).toHaveTextContent('Rent')
    expect(document.documentElement.lang).toBe('en')
    expect(document.documentElement.dir).toBe('ltr')
  })

  it('switches to French (FR) with LTR direction and full translations', async () => {
    const user = userEvent.setup()
    render(
      <div>
        <LanguageSelector />
        <TranslationConsumer />
      </div>,
    )

    // Open language dropdown
    await user.click(screen.getByRole('button', { name: /Language|Langue|اللغة/ }))
    // Select French
    await user.click(screen.getByRole('option', { name: /Français/ }))

    expect(getLanguage()).toBe('fr')
    expect(document.documentElement.lang).toBe('fr')
    expect(document.documentElement.dir).toBe('ltr')
    expect(screen.getByTestId('current-lang')).toHaveTextContent('fr')
    expect(screen.getByTestId('is-rtl')).toHaveTextContent('false')
    expect(screen.getByTestId('login-title')).toHaveTextContent('Connexion')
    expect(screen.getByTestId('proxy-login-title')).toHaveTextContent('Connexion')
    expect(screen.getByTestId('envelopes-title')).toHaveTextContent('Enveloppes')
    expect(screen.getByTestId('rent-name')).toHaveTextContent('Loyer')
  })

  it('switches to Arabic (AR) with mirrored RTL direction and full Arabic translations', async () => {
    const user = userEvent.setup()
    render(
      <div>
        <LanguageSelector />
        <TranslationConsumer />
      </div>,
    )

    // Open language dropdown
    await user.click(screen.getByRole('button', { name: /Language|Langue|اللغة/ }))
    // Select Arabic
    await user.click(screen.getByRole('option', { name: /العربية/ }))

    expect(getLanguage()).toBe('ar')
    expect(document.documentElement.lang).toBe('ar')
    expect(document.documentElement.dir).toBe('rtl')
    expect(screen.getByTestId('current-lang')).toHaveTextContent('ar')
    expect(screen.getByTestId('is-rtl')).toHaveTextContent('true')
    expect(screen.getByTestId('login-title')).toHaveTextContent('تسجيل الدخول')
    expect(screen.getByTestId('proxy-login-title')).toHaveTextContent('تسجيل الدخول')
    expect(screen.getByTestId('envelopes-title')).toHaveTextContent('الأظرف')
    expect(screen.getByTestId('rent-name')).toHaveTextContent('الإيجار')
  })
})
