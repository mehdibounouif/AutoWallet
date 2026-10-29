import { useState } from 'react'
import type { FormEvent } from 'react'
import type { Translations } from '../../../i18n'
import { Field, Input } from '../../../components/ui/Field'
import { FormCard, FormHeading } from '../../../components/ui/FormCard'

interface Step1AboutProps {
  firstName: string
  setFirstName: (value: string) => void
  lastName: string
  setLastName: (value: string) => void
  t: Translations
  onSubmit: (event?: FormEvent) => void
  externalFirstNameError?: string | null
  externalLastNameError?: string | null
}

export function Step1About({
  firstName,
  setFirstName,
  lastName,
  setLastName,
  t,
  onSubmit,
  externalFirstNameError,
  externalLastNameError,
}: Step1AboutProps) {
  const [firstNameTouched, setFirstNameTouched] = useState(false)
  const [lastNameTouched, setLastNameTouched] = useState(false)

  const firstNameError = externalFirstNameError || (firstNameTouched && firstName.trim().length < 2 ? t.firstNameRequired : null)
  const lastNameError = externalLastNameError || (lastNameTouched && lastName.trim().length < 2 ? t.lastNameRequired : null)

  return (
    <FormCard width="md">
      <FormHeading title={t.aboutYouTitle} description={t.aboutYouSubtitle} />
      <form onSubmit={onSubmit} className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t.firstNameLabel} htmlFor="first-name-input" error={firstNameError}>
            <Input
              id="first-name-input"
              autoComplete="given-name"
              type="text"
              required
              autoFocus
              value={firstName}
              onBlur={() => setFirstNameTouched(true)}
              onChange={(event) => {
                setFirstName(event.target.value)
                if (firstNameTouched && event.target.value.trim().length >= 2) setFirstNameTouched(false)
              }}
              aria-invalid={Boolean(firstNameError)}
            />
          </Field>
          <Field label={t.lastNameLabel} htmlFor="last-name-input" error={lastNameError}>
            <Input
              id="last-name-input"
              autoComplete="family-name"
              type="text"
              required
              value={lastName}
              onBlur={() => setLastNameTouched(true)}
              onChange={(event) => {
                setLastName(event.target.value)
                if (lastNameTouched && event.target.value.trim().length >= 2) setLastNameTouched(false)
              }}
              aria-invalid={Boolean(lastNameError)}
            />
          </Field>
        </div>
      </form>
    </FormCard>
  )
}
