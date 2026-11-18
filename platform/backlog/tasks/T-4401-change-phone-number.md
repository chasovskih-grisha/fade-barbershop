# T-4401 · Phone Number Change (ChangePhoneNumber)

- **Stage**: M2 (phase 5) · **Tags**: backend, security · **Complexity**: middle · **Depends on**: T-010, T-060
- **StoryPoints**: 5

## What

Use case `ChangePhoneNumber` from `identity` README plan — "separate, not a second login" (ADR 0005):

- Client (from an active session) initiates change: new number → OTP verification of the **new** number (same `RequestOtp`/`VerifyOtp` mechanism, `change_phone` channel).
- Confirmation is atomic: `PhoneNumber` must be unique — taken number is rejected; old session remains active, new logins use the new number; `PhoneNumberChanged` event (outbox) → CRM profile updates phone.
- Anti-abuse: change limit (e.g. 1/30 days), change log; admin page for phone change "via support" — as fallback path (`web-cabinet-screens.md` §2 hint).
- Mobile and web share the same use case; number = login (ADR 0005), so change does not create a second `User` (invariant 6).

## Why

Phone is the single client identifier: person changes SIM — loses account, visit history, loyalty, and unused certificates. ADR 0005 and identity README define the use case, but backlog task was missing (discovered by audit 2026-09-23).

## Sources

- identity README (use case `ChangePhoneNumber`)
- ADR 0005 ("Phone change — separate use case, not 'another login'")
- web-cabinet-screens.md §2 (hint "Phone change — via support")
- bounded-contexts.md invariant 6 (one number → one `User`)

## Done

- [ ] Phone change via new number OTP verification works on web and mobile
- [ ] Taken number rejected; second `User` not created (invariant 6 test)
- [ ] `PhoneNumberChanged` event in outbox; CRM profile and loyalty preserved
- [ ] Change limit and log; admin path "via support" operational
- [ ] e2e: phone change → login with new number → same `User` and profile

## Risks

- [ ] **Number interception** (SIM re-issuance by operator): OTP on new number has the same risk as login; suspicious frequent changes trigger alert (linked to T-3604)
