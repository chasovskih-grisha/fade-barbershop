# T-4400 · Production SMS Provider for OTP (TurboSMS/AlphaSMS/Twilio)

- **Stage**: M2 (v1 launch gate) · **Tags**: backend, integration · **Complexity**: middle · **Depends on**: T-010, T-4301
- **StoryPoints**: 5

## What

Real implementation of the `SmsSender` port for production — a "separate task" explicitly referenced by T-010 (risk) and T-4301, which was missing from the backlog:

- Selection and contract with a provider (Ukrainian: TurboSMS, AlphaSMS; fallback — Twilio/Vonage), registered sender alpha-name (FADE).
- `SmsSender` adapter for the selected provider + `FallbackSmsSender` (primary → reserve, alert upon degradation) — configuration switching (`SMS_PROVIDER`), same as in T-4301.
- Keys and limits in secret manager (T-300), not in repo; provider budget/limits with alerts (balance exhaustion = clients unable to login).
- Delivery monitoring (delivery rate, provider errors) — metric in T-4204.
- Load testing: Saturday booking peak (OTP spike) does not hit provider rate limits.

## Why

v1 launch checklist gate: "OTP SMS provider works" (roadmap, "Data and operational readiness"). Without this task, system login is impossible in production: T-010 provides only console sender, T-4301 provides only mock for dev/test/stage.

## Sources

- roadmap v1 checklist ("OTP SMS provider works")
- T-010 (risk "SMS provider as a separate task"), T-4301 (`SmsSender` port, prod-only implementations)
- bounded-contexts.md (external providers → ACL, `notifications` ──conformist──▶ provider)

## Done

- [ ] Prod provider connected via `SmsSender` port; FADE alpha-name works
- [ ] Fallback provider configured; primary degradation → alert, not login failure
- [ ] Secrets in secret manager; balance and limits with alerts
- [ ] E2E OTP test on live provider passed (stage)
- [ ] Provider documentation and degradation procedures in `identity` README

## Risks

- [ ] **Alpha-name registration** takes weeks with providers — start early, before launch gate
- [ ] **Cost/limits**: OTP spike during attack on `/identity/otp/request` — rate limit T-010 + budget alert
