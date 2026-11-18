# T-4578 · Authentication Flow Analytics (OTP Login/Register)

- **Stage**: M3 (phase 3 — website, parallel with phase 6 — mobile) · **Tags**: frontend, analytics, identity · **Complexity**: junior · **Depends on**: T-4575, T-4576, T-010, T-011
- **StoryPoints**: 3

## What

Authentication funnel tracking: phone → OTP → success/failure. Critical for linking anonymous sessions with known users (identity resolution).

Events:
- `auth_otp_requested`
- `auth_otp_verified` (success / error code)
- `auth_session_established`

## Why

Knowing drop-offs during login/registration ensures smoother onboarding.

## Sources

- T-4575 (Amplitude setup), T-010 (OTP)

## Done

- [ ] Auth events tracked in Web and Mobile
- [ ] Funnel analysis visible in analytics
- [ ] Tests verify event emission on correct actions

## Risks

- [ ] **PII logging risk**: phone numbers or OTP codes must never be sent as event properties or parameters.
