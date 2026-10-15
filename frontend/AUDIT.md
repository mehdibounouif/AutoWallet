# Frontend audit — October 15, 2026

Scope: application code, routes, styles, shared components, build output, dependency advisories, and responsive behavior. Backend and QA-owned test files were not changed. Existing uncommitted frontend work was preserved.

## Changes completed

| Finding | Change |
| --- | --- |
| Dashboard screens and onboarding overflowed at 768px. The compact dashboard header also crowded the logo. | Added a tablet sidebar rail, corrected onboarding stepper breakpoints, allowed Home actions to wrap, and shortened the visible service label on phones. |
| Fixed navigation and dialogs did not account consistently for phone safe areas or changing viewport height. | Added safe-area spacing and dynamic viewport sizing; improved small-screen inputs, verification-code cells, ribbon labels, and drawer controls. |
| Dialogs repeated overlay markup and did not consistently trap focus, restore focus, close on Escape, or lock background interaction. | Added a shared Dialog for payment recording, simulation, payment details, rule editing, and backup-code entry. Saving dialogs cannot be dismissed mid-request. |
| Menus had repeated document listeners or stayed open after outside clicks. | Added a shared dismissal hook used by Activity filters, rule menus, account menus, notifications, and mobile navigation. |
| Dashboard navigation mixed local state with route state. Home also reused Activity's filtered payments. | Made the URL determine the active page and confined reference filtering to Activity. Browser navigation returns to the matching screen. |
| An envelope URL such as `/app/envelopes/constructor` passed the object membership check. | Restricted lookup to the envelope map's own keys; invalid envelopes render the existing error screen. |
| Currency/date formatting, amount validation, rule descriptions, and target lookup were repeated. | Consolidated these helpers. Rule descriptions now respect the actual comparison operator; progress targets use upper-bound conditions. |
| The translation interface duplicated the entire English dictionary. | Inferred the type from the dictionary and removed its unused copy entry. |
| Signup draft reads trusted arbitrary stored JSON, and draft cleanup was repeated. | Added a shared parser and storage helpers that allow only known non-secret fields. Passwords remain in memory and legacy stored passwords are stripped at startup. |
| Two-factor login discarded the requested destination. Login and signup could also retain form state when switching modes. | Preserved the validated destination through two-factor entry and remounted auth screens when the mode changes. Added appropriate autocomplete hints. |
| The signup simulation timer was not cleaned up. | Clear it when onboarding unmounts and prevent repeated simulation starts. |
| Email verification resend only ran a countdown. | Marked sending verification links as unavailable rather than implying a message was sent. |
| Secondary authentication and legal screens were in the initial application bundle. | Load these screens on demand. The main JS file decreased from approximately 326 KB to 243 KB; shared chunks are loaded separately, so this is not a 25% reduction in total first-load transfer. |
| Activity grouping copied the growing group array for every transaction. | Append to groups instead; defer reference filtering while typing and reuse date formatters. |
| History trusted API order and treated a missing envelope allocation as zero. | Sort dated transactions once and require explicit allocations for the envelope before reconstructing its history. Preserve server order when dates are incomplete. |
| Dashboard reads could remain pending indefinitely. | Added a 15-second timeout while preserving cancellation. |
| npm reported two high-severity vulnerable transitive packages. | Updated only `brace-expansion` 5.0.9 → 5.0.12 and `source-map-js` 1.2.1 → 1.2.2. npm reported zero vulnerabilities after the update. See the [brace-expansion advisory](https://github.com/advisories/GHSA-q2hr-2g5m-vwhr) and [source-map-js advisory](https://github.com/advisories/GHSA-68fv-2mgg-jv7q). |

All application source modules are reachable from the entry point, and the stylesheet class scan found no unused selectors after accounting for dynamic class names. No entire source file was deleted on an assumption that it was unused.

## Verification

- TypeScript/Vite production build, ESLint, and `git diff --check` passed.
- A browser sweep checked 20 routes/states at 320, 390, 768, 1024, and 1440px: 100 combinations with no detected horizontal overflow or page errors after the changes.
- Browser interactions passed at 320, 390, 768, and 1440px: Activity filters and clearing, mobile search focus, Home after searching, dialog Tab containment and Escape dismissal, background unlock, rule PATCH payloads, invalid envelope URLs, and two-factor return navigation.
- A complete signup flow passed at 320px, including a duplicate bank-account rejection on the account step, successful registration, rule saving, payment simulation, dashboard navigation, and draft cleanup.
- Browser checks used mocked API responses. They verify frontend behavior, not availability of the running backend, authorization service, Google provider, or WebSocket delivery. Real mobile keyboard and safe-area behavior still benefits from checking on physical devices.
- Existing Vitest suite: **42 passed, 4 failed**, matching the four failures observed before this audit. No test files were edited.

The four existing test failures need QA updates: the tests expect the unavailable Move money action to be clickable, omit the Rules and Activity routes from their router harness, and submit an `MA`-prefixed bank ID despite the current numeric-ID validation. The browser checks cover the corresponding supported navigation and numeric account flow.

## Remaining feature and deployment work

- Password recovery, email verification sending, and backup-code sign-in require backend support.
- Creating, deleting, pausing, and reordering individual rules, spending, and transfers remain unavailable through the current frontend/API contract.
- Analytics, Assistant, Settings, and the full Notifications design remain to be implemented. Payment details and payment recording/sandbox still use the existing dialogs.
- Live WebSocket updates are not connected. The dashboard refreshes after supported writes, reconnection, and returning to the tab.
- Historical dates and splits depend on the fields returned by the API; the UI does not fabricate them.
- `frontend/Dockerfile` remains empty; a production frontend container and reverse-proxy deployment need a separate implementation and deployment check.
- `architecture.md` is a historical repository snapshot. Use the frontend README and this audit for current frontend status.
