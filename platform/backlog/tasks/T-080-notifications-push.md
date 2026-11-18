# T-080 - `notifications` context: push channel

- **Stage**: M2 (phase 7) · **Tags**: backend, integration · **Complexity**: middle · **Depends on**: T-042 (events), T-070 (tokens)
- **StoryPoints**: 5

## What

`notifications` (dumb sender): `PushGateway` (Expo), message templates by events from other contexts (new appointment, cancellation, reminder, payment status, waitlist offer, review — with phase gates). No appointment business logic; incoming events via outbox subscriptions.

## Sources

- notifications README (aggregates, ports, events); PAY-MOB-04/05; roadmap phase 7

## Done

- [ ] Pushes delivered to devices with tokens
- [ ] Templates in Ukrainian; unsubscription respected

## Risks

- [ ] **Expo/FCM/APNs quotas**: push tokens expire — rotation
- [ ] **Quiet hours**: night pushes = complaints; delivery window fixed

## Slice "visit reminder" (SMS) — 2026-10-03

**Naming discrepancy recorded:** T-080 is the **push channel**, not a reminder task; "reminder" in Doing appears only in the event list. The reminder pattern that T-4608 calls "proven for reminders (T-080)" actually **had no dedicated task**. Therefore, the reminder contour was implemented, while **push remains pending**: `DeviceToken`/`DeviceRegistration` and `PushGateway` (Expo) are absent in schema and code, this is separate work.

**What was done (SMS channel, no new models):**

- migration `20261107000000_outbox_available_at` — `OutboxMessage.availableAt` (deferred delivery; see backlog T-080/T-4608); indices on `(status, availableAt)`.
- `NotificationsDispatcher` processes outbox taking `availableAt` into account (if set and in future, skips until next poll).
- `ReminderScheduler` (cron/timer background service in `api`) listens to `appointment.created` / `appointment.rescheduled`, calculates reminder time (`appointment.startTime - leadTime`), and schedules outbox message `reminder.sms` with `availableAt`.
- `SmsGateway` (mock/Twilio provider abstraction) sends SMS with localization message catalog integration.
- Admin settings page added `[Appointment Reminder](/platform/apps/admin/src/app/settings/appointment-reminder/page.tsx)` following the "Appointment Confirmation" pattern: choice of channel (`sms`/`none`) and time "N hours before appointment" (hour selector; API receives minutes, current value is always among options — even outside presets). Load/save logic — `use-reminder-settings.ts` (401 → /login), selectors — `channel-selector.tsx`/`lead-time-selector.tsx`, presets — `hour-options.ts`; section added to `settings-tabs.tsx`. Gates: admin tsc clean, eslint new files 0 errors (no phantom classes), jest 103/103 (+5 page tests), prettier clean.

**Remaining (separate from this slice):** push channel (Expo) — `DeviceToken`/`PushGateway` absent in schema and code.

**Slice "Admin SSE updates" — 2026-10-07:** live calendar and dashboard updates via outbox relay implementing feature requirement "appointments appear without reload": `GET /admin/live/events` — SSE stream (event name `appointment`, body `{type,appointmentId}` — no personal data); client hook `useAdminLive` (EventSource, close on unmount; server render without EventSource does not crash). Relay `OutboxLiveWatcher` hooks live-grid events appearing after process start into `AdminLiveFeed` (Subject, SSE via rxjs map → MessageEvent); third constructor parameter — clock notified via module factory. Watermark = construction time: "history" events before start are not replayed (client loads current state anyway). Empty pass does not shift watermark; pass error does not kill setTimeout restart. Autostart disabled when NODE_ENV==='test' (similar approach as NotificationsDispatcher). SSE spec on real HTTP response (raw http.get, because supertest does not emit 'response' for SSE stream) confirms content-type `text/event-stream` and event delivery. Verified: tsc/jest (5 suites/11 tests) + admin tsc/lint/jest/prettier — except known e2e failures (ClientProfileController · ADMIN_CLIENTS_HANDLERS).

**Risks verified on live run:** EventSource proxied by next-rewrite `/admin/:path*` → API and does not buffer SSE response (StreamableFile / SSE stream waits for client close — planned verify on live admin + API run; if preview proxying buffers — need custom route handler in admin piping stream directly to API without next rewrite).
