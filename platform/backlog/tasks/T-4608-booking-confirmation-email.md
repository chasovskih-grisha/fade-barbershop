# T-4608 · Booking confirmation email (first outbox consumer in notifications)

- **Stage**: M5 (phase 27-28) · **Tags**: backend, notifications, email · **Complexity**: middle · **Dependencies**: T-042a, T-4408, T-021
- **StoryPoints**: 5

## What

On visit creation (`scheduling.appointment.booked` in outbox) `notifications` context sends confirmation email via common `EmailSender` (T-4408: console/mailpit/smtp by `EMAIL_PROVIDER`). First `notifications` context code (README: "Push / SMS / email by other contexts' events").

## Why

Client must have booking confirmation outside screen; notifications context gets first consumer and verified pattern for reminders (T-080), receipts (T-4434), win-back (T-4454). Also closes "who reads outbox" question: before this no one consumed events (in dev DB accumulated 233 unread `booked` events).

## Requirement sources

- notifications README (Generic subdomain, notifications by other contexts' events)
- T-042c (idempotent handler — log with unique eventId); T-4408 (EmailSender)
- ADR 0005 (identity by phone → v1 recipient — location email, T-021)

## Implementation (2026-09-28)

- **`notifications/application/send-booking-confirmation.ts`** — pure `handleOne(event)` consumer: only `scheduling.appointment.booked`; duplicate by log → `duplicate`; no location email → `skipped` + log record (eventId occupied, repeat doesn't spam); success → email + `sent` record. Send failure NOT written to log — event stays pending, repeated delivery has right to new attempt (at-least-once). Email time — `Europe/Kyiv` human language.
- **`infrastructure/`**: `PrismaNotificationJournal` (log `NotificationRecord`, eventId unique — migration `20261104000000`), `PrismaLocationContacts` (location emails from T-021; client email appearance in CRM changes only this adapter), `OutboxNotificationsDispatcher` — light poller **only own** event types (`publishedAt` as "processed by notifications" marker; idempotency holds by log, not marker). `NOTIFICATIONS_OUTBOX_POLL_MS` (default 15000, 0 — disable, auto-start off in jest). Common relay (T-042 slice 1) will replace poller without `handleOne` contract change.
- **Seed**: locations now seeded with email (`podil@/obolon@/lviv@fade.dev`) — on fresh environment confirmation emails work immediately, not silently skipped.
- **Model**: `NotificationRecord` (eventId unique, channel, recipient, subject, status sent/skipped, detail, sentAt) — log for support and dedup.

## Done

- [x] `booked` event → email via EmailSender; idempotency by log (14 unit specs: consumer ×7, dispatcher ×6, wiring ×1)
- [x] Retry semantics: send failure not written to log; skipped for locations without email
- [x] Live verification: event in outbox → email in Mailpit (`podil@fade.dev`, "FADE: visit recorded (October 5, 2026 at 13:00)"), repeated run — no duplicate
- [x] Locations seed with email; poller env switch documented

## Risks / open questions

- V1 recipient — location (not client): client email doesn't exist in schema (ADR 0005). When appears in CRM profile — redirect email to client (one adapter change).
- `publishedAt` marked by notifications consumer; when common relay arrives — agree marker semantics (relay may require "all consumers processed").
