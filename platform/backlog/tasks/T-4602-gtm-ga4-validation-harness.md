# T-4602 · QA Stand: GTM Preview, DebugView, Realtime and "Exactly Once" Tests

- **Stage**: M3 (phase 14 — analytics) · **Tags**: analytics, qa, testing, validation, frontend · **Complexity**: middle · **Depends on**: T-4596, T-4597, T-4600, T-4601
- **StoryPoints**: 5

## What

Repeated verification of "counting exactly what we think" — automated (E2E assertions on dataLayer) and manual (GTM Preview / DebugView / Realtime). Without this, the 24-event pipeline degrades imperceptibly.

### Automated (Playwright, `apps/web`)
- Add `@playwright/test` to devDependencies (currently web only has jest) + `tests/e2e/analytics.spec.ts`.
- Hook in tests: override `measurement_id` with test/`debug_mode`, intercept GA4 collection at the network level (do not "wait for UI appearance").
- Assertions:
  1. `test(home) → navigate /services` — `page_view` × 2, no more (count pushes in `window.dataLayer`).
  2. Dev mode (StrictMode) does not duplicate `page_view`.
  3. `consent = denied` → **zero** requests to `google-analytics.com`; `granted` → expected.
  4. Full flow (5 steps + confirmation with stubbed API) — each funnel event **exactly once**, `booking_confirmed` with correct `booking_id`/`booking_value`.
  5. Unsuccessful `POST /booking/bookings` → `booking_failed` with `error_code`, without raw text.
  6. `/login?code=123456` → `page_location` no `code`; `utm_*` preserved.
  7. Click CTA → `sessionStorage` contains navigation ctx; first push to `/booking` has `entry_point`, record deleted.
  8. UUID format for `session_id`/`anon_id`/`funnel_instance_id` (values not compared).
- Jest-Tests (infrastructure already exists): `pushEvent` does not push without consent; `emission: 'server'` event from client does not enter dataLayer.

### Manual (checklist, executed before T-4603)
- **GTM Preview**: Tags/Variables/Events panels — exactly one GA4 tag per push; zero "red tags".
- **Tag Assistant** → Consent Mode: no errors.
- **GA4 DebugView**: events with `debug_mode=1` arrive in ~1–3 s (streaming).
- **Realtime**: event appears in ~30 s; office IP filtered.
- **Same host**: navigation to `/booking` in one view = **one** session in GA4, `entry_point` set.
- **MP**: test payment → `payment_captured` in DebugView in ~1 min; does not arrive twice.
- **Negative test**: incorrect `measurement_id` → error in GTM Preview (designed to see error, not "silence").

### CI
- Jest part — in regular `pnpm --filter @fade/web test` immediately.
- Playwright — locally first (separate script `pnpm --filter @fade/web test:e2e`); integration into CI — as a separate step after T-002 (CI), since e2e CI infrastructure does not exist yet.

## Why

The most frequent analytics defect is not an accidentally added event, but an event that was **counted twice**. Manual browser verification does not catch this (DebugView does not show a duplicate `page_view` if the event is identical with the same name and params — they are only visible in the raw dataLayer). Assertions on `window.dataLayer` are the only check providing real guarantee.

## Sources

- T-4589 (Amplitude validation — base approach), T-4596/T-4597 (events), T-4600 (consent), T-4601 (PII)
- T-002 (CI) — e2e in CI as a separate step

## Done

- [ ] Playwright installed in `apps/web`, 8 assertions from Done criteria are green
- [ ] Jest-Tests for contract/consent are green
- [ ] Manual checklist (GTM Preview, Tag Assistant, DebugView, Realtime, cross-domain, MP) passed and signed
- [ ] Verification report added to task with date and screenshots
- [ ] `test:e2e` script in `apps/web/package.json`; documented that it is not yet included in CI and why
- [ ] Known and documented discrepancy: GA4 ≠ DB (source of GAAP difference — consent-loss, last-click, MP-clients)

## Risks

- [ ] **Playwright as a new dependency**: adds ~300 MB of browsers and CI time; therefore e2e is a separate script, not in jest
- [ ] **dataLayer stabilization**: count array length, not the last element (previously pushed events are retained)
- [ ] **Stub hosts**: stage does not write analytics (T-4591) — some assertions require local override of `NEXT_PUBLIC_GTM_ID`, coordinate with T-4600
- [ ] **"Incorrect measurement_id" test** may not work on GTM Console — in that case replace check with DebugView check
