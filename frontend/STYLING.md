# Frontend text and styling

## English copy

Write page-specific English text directly in the component that renders it.
Use normal template strings for dynamic messages. Shared validation and service
messages live in `src/content/messages.ts`; import the individual constant you need.
Components do not accept a translation object.

`src/i18n/index.ts` is temporarily retained for the QA-owned tests that still import
it. It is not imported by application code or included in the runtime bundle.
QA can remove this adapter after replacing those imports with English assertions
and removing the obsolete `t` props from test fixtures.

## Shared Tailwind components

Use `src/components/ui/` for common UI:

- `Button`: native button props, including `ref`, plus `variant` and `appearance`.
  It defaults to `type="button"`; explicitly use `type="submit"` in forms.
- `TextInput`: native input props, including `ref`. Labels, validation messages,
  `aria-invalid`, and `aria-describedby` remain with the form.
- `Card`: a workspace surface; use `as="section"` or `as="article"` when appropriate.
- `Notice`: an informational, success, or error message. Set `role="status"` or
  `role="alert"` at the call site when the message should be announced.
- `AuthPanel`: the shared responsive panel for authentication screens.

`styles.ts` supplies the same button and card styles for links, so navigation
keeps native link behavior. Use `appearance="auth"` for the existing authentication
control sizing and light background. Use `appearance="onboarding"` for signup
footer actions. Workspace controls follow the selected theme.

```tsx
<Button type="submit" disabled={saving}>
  {saving ? 'Saving…' : 'Save changes'}
</Button>
```

## Tokens and custom CSS

`src/index.css` defines Tailwind color and font tokens. Prefer semantic utilities
such as `bg-action-primary`, `text-brand-muted`, `bg-panel`, and `border-line`
over repeated hexadecimal values. Workspace tokens resolve through the existing
`--aw-*` theme variables, including inside portal dialogs.

Page CSS remains for responsive page composition, tables, charts, the payment
split graphic, and contextual layout rules. Shared control appearance belongs in
the UI components. Existing class names such as `dashboard-input` are retained
where page layout rules or QA selectors depend on them.

When changing shared styles, run `npm run lint`, `npm run build`, and `npm test`.
Check mobile and desktop widths, light and dark themes, keyboard focus, disabled
and pending states, dialogs, and long amounts. QA-owned tests are maintained by QA.
