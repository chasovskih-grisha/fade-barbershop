# T-4408 · Email Dev Container (Mailpit)

- **Stage**: M1 (phase 2) · **Tags**: backend, infra, testing · **Complexity**: middle · **Depends on**: T-010, T-4301
- **StoryPoints**: 5

## What

Mirror of T-4301 for email channel: Mailpit Docker container in compose (shared with SMS channel — `smspit`, port 19096), `EmailSender` interface port with environment switching (`EMAIL_PROVIDER`): `ConsoleEmailSender` (default), `MailpitEmailSender` → container HTTP API, `SmtpEmailSender` (nodemailer) — prod only (per T-4202). Web UI for email preview in dev/test.

## Why

Email channel is required by upcoming phase tasks (T-4434 electronic receipts, T-4446 Add to calendar, T-4454 win-back) — without dev container, emails are tested "in the dark".

## Sources

- ADR 0018 (docker dev-environment); T-4301/SMSPit pattern; engineering-principles.md (ports/fakes)

## Done (2026-09-29)

- [x] Mailpit in compose (`smspit`, shared container with SMS — unique port on 127.0.0.1)
- [x] `EmailSender` port + three implementations (console/mailpit/smtp) with tests (7 unit specs: factory ×4, Mailpit payload ×2, SMTP transporter)
- [x] Test "email sent" — live run: HTML email in Mailpit API (`To: client@example.dev`, "T-4408 smoke"), visible in Web UI; re-verified 2026-09-29 — host + in-container (via `smspit:8025`) smoke after connecting email channel in compose api (README log)

## Risks

- [x] **Logic duplication**: email DTO has own contract `EmailInput` in `shared/email/ports.ts`; SMS (T-4301) stays on identity `OtpSender` — intersection only in Mailpit container, not in code
