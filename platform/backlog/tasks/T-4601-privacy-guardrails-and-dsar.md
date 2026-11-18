# T-4601 · Privacy guardrails: parameter allowlist, PII-stop, DSAR in GA4

- **Stage**: M3 (phase 3 — site) · **Tags**: analytics, privacy, legal, high-risk · **Complexity**: middle · **Dependencies**: T-4594, T-4595, T-4588
- **StoryPoints**: 3

## What

Mechanical (not "remember") PII ban in analytics + procedures needed when data deletion request arrives.

### 1. Allowlist instead of denylist
- `dataLayer` accepts **only** parameters from T-4595 contract. Difference: new parameter requires contract change (PR review), not "just added — will see".
- In GTM only allowlisted variables allowed; Tag Assistant shows what pushes even if unnoticed.

### 2. Rules that work mechanically
- **URL**: `page_location` collected from allowlisted query params; `phone`, `code`, `token`, `otp`, `email` always stripped (T-4592). Example risk: `/login?code=123456` — OTP in GA4.
- **Errors**: to GA4 goes `error_code` (short code from list) + static text; raw API error body not passed to dataLayer or Amplitude (it may contain phone/email). Raw stack — only in server logs with defined retention.
- **Booking comment, name, email, phone** — never (T-4597).
- Identifiers: `user_id` = DB user UUID; `anon_id`/`session_id`/`client_id` = our UUIDs; no phones/emails as id.
- **GTM Preview** not used on prod data with PII: preview sends content to Google.

### 3. Strictest GA4 settings
- Retention 14 months, `ad_user_data`/`ad_storage`/`ad_personalization` = `denied`, no `user_properties` with PII.
- `admin.fade.com.ua` not in data stream; internal traffic (office IP, staging) — filter in GA4 + exclusion at data stream level.
- IP anonymization — built into GA4, no separate settings needed.

### 4. DSAR: data deletion
- GA4 has no user deletion UI — only **Data Deletion API** (call on `user_id`). Procedure: request → API call → confirmation → log record.
- Honest limit: aggregated/trimmed data stays (GA4 limitation) — client response must say this.
- Right-to-access: GA4 doesn't return personal data, request processed from DB (T-4402).

### 5. Automatic CI control
- `scripts/check-analytics-pii.mjs`: scans `apps/web/src/lib/analytics` and `pushEvent` calls for banned keys (`phone`, `email`, `code`, `token`, `comment`, `name`) and direct `dataLayer.push` outside contract.
- Test fails on CI — "banned name" doesn't pass review accidentally.

## Why

Most expensive analytics mistake — not missing event, but event with personal data: it irreversible (data already in Google), legally sensitive and costs longer than any "not all events arrived" loss. Mechanical rules cheaper than review.

## Requirement sources

- T-4588 (privacy baseline), T-4402 (banner/DSAR)
- T-4594 (dimensions), T-4595 (contract), T-4592 (URL), T-4597 (errors/comment)

## Done

- [ ] `dataLayer` accepts only contract parameters; direct `dataLayer.push` outside `pushEvent` — test fail
- [ ] `scripts/check-analytics-pii.mjs` in CI: blocks `phone|email|code|token|comment|name` in analytics
- [ ] `/login?code=…` doesn't give `code` in `page_location` (regression, T-4592)
- [ ] GA4 error events don't contain raw API response body
- [ ] Internal traffic filter works: office IP absent in Realtime
- [ ] DSAR procedure described (Data Deletion API) and verified on test `user_id`
- [ ] Client response about GA4 limits (aggregates remain) formulated in `docs/privacy` (T-4402)
- [ ] No GA4/Amplitude parameter allows reconstructing phone

## Risks

- [ ] **Allowlist error stops event**: forgotten parameter = `(not set)` in report, better than PII; so contract changes — via PR
- [ ] **GTM Preview** — most common leak; fixed in container README
- [ ] **Data Deletion API not immediate**: processing up to 72 hours — account in client response SLA
- [ ] **Different rules in Amplitude and GA4**: common contract (T-4595) — single control point, so can't bypass it
