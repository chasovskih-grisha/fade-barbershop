# T-4422 · Client Devices and Sessions

- **Stage**: M1 (phase 1) · **Tags**: backend · **Complexity**: middle · **Depends on**: T-014, T-070
- **StoryPoints**: 5

## What

Client active sessions/devices list (web/mobile, current device + login history per ADR 0017): "log out everywhere", refresh token invalidation, notification on other devices about a new login (security element of already implemented verifications).

## Why

Access from an unauthorized device after SMS login is a frequent loss of control; session list = shared with T-4417 (privacy) and first defense against session hijacking after leaving the booking flow.

## Sources

- identity README; ADR 0017 (refresh tokens); web-cabinet-screens.md; client-screens.md

## Done

- [x] API: session list (bearer, date, current) and "log out everywhere" (`GET`/`POST /identity/client/sessions`, smoke 2026-09-30)
- [x] Cabinet (web/mobile) shows this list and "log out everywhere" button (web — done 2026-10-07; mobile — in T-070)
- [x] New login → email to other devices (Mailpit, 2026-09-30)
- [x] Push to other devices — only when channel is allowed (2026-10-07)
- [x] Invalidation leaves no active refresh tokens (test)

## Implementation plan

Paths:
- `apps/api/src/identity/application/list-client-sessions.ts` — active sessions of the signed-in client, current session decided by the server; admin sessions never listed (ADR 0017).
- `apps/api/src/identity/application/revoke-all-sessions.ts` — revoke every other active session, keep the current one alive, emit one `identity.sessions.revoked.all` event with count and `exceptSessionId`.
- `apps/api/src/identity/infrastructure/client-sessions.controller.ts` — `GET /identity/client/sessions` and `POST /identity/client/sessions/revoke-all` behind `ClientSessionGuard`.
- `apps/web/src/app/account/devices/DeviceList.tsx` — list with channel, login time, «Цей пристрій» badge and the «Вийти з усіх інших пристроїв» control with confirmation.

Tests:
- `apps/api/src/identity/application/list-client-sessions.spec.ts`
- `apps/api/src/identity/application/revoke-all-sessions.spec.ts`
- `apps/web/src/app/account/devices/devices.test.tsx`

Checks:
- `pnpm --filter @fade/api exec jest apps/api/src/identity/application/list-client-sessions.spec.ts apps/api/src/identity/application/revoke-all-sessions.spec.ts`
- `pnpm --filter @fade/web exec jest apps/web/src/app/account/devices/devices.test.tsx`

## Progress

- **2026-09-30 — backend-Slice end-to-end (live smoke on Postgres/Mailpit)**: `Session.createdAt` getter (device list); ports `SessionRepository.findActiveByUser`, `UserRepository.findByEmail`; `User.email` (migration `20260930000000_user_email`, unique — shared inbox = someone else's notifications; '' clears address). Use cases: `ListClientSessions` (web/mobile, admin not shown per ADR 0017; current is determined by SERVER via request session), `RevokeAllSessions` (revoke other active ones, keep current alive — otherwise client would be kicked out of cabinet; single event `identity.sessions.revoked.all` with count + `exceptSessionId`), `SetClientEmail` (normalization, RFC limit 254, taking address → `CLIENT_EMAIL_TAKEN` 409; repeat same — no event). Events in separate file `events.client-sessions.ts` (max-lines gate). HTTP: `GET /identity/client/sessions`, `POST /identity/client/sessions/revoke-all` (rate limit by OTP limiter, T-4410), `PUT /identity/client/email`; `ClientSessionGuard` (cookie web + Bearer mobile; admin → 401; mobile expired access → 401). Notifications: `NewDeviceAlert` consumes `identity.session.started` → "new login" email to client email (no address — skipped with log; text names channel and "Log out of all devices"), outbox dispatcher extended to identity types (shared NotificationRecord log, eventId unique). Contracts: ListClientSessionsResult/RevokeAllSessionsResult/SetClientEmailInput + 2 new events in IDENTITY_EVENTS. **DI Lesson (found by live smoke)**: duplicating Nest provider token with untyped bundle silently overwrites typed `useCase` factory — final instance received deps in wrong order → `findActiveByUser is not a function` at runtime, unit/e2e tests didn't catch it (mocked PrismaService). Fix: bundle `CLIENT_SESSION_USE_CASES` — single registration, handler construction in factory (rest-args, NotificationsModule pattern). Gates: tsc clean, lint 0 errors, jest api **845/845 (197 suites)**, admin 60/60. Live smoke: web login → GET sessions (`current: true`), PUT email → 200, mobile login → 2 sessions in list, revoke-all → `revokedCount: 1`, mobile in DB revoked=t and refresh dead, in Mailpit — email "FADE: new login" with channel "mobile application" and time Europe/Kyiv.

## Progress

- **2026-10-07 — UI-Slice cabinet + push channel**: `apps/web` has screen `[Devices](/account/devices)` — list of active sessions (channel "Website" / "Mobile application", login time, badge "This device"), button "Log out of all other devices" with confirmation in `Modal`, loading/error/empty states (4 jest tests, `devices.test.tsx`); item "Devices" added in `AccountShell`. Push channel: model `PushToken` (migration `20261109000000_push_token`) — Expo token globally unique, bound to session (device = session), `POST /identity/client/push-tokens` (registration/rebind) and `/revoke` (idempotent POST, not DELETE — body on DELETE gets truncated by some clients), separate `PushTokensController` (max-lines gate). Notifications: `NewDeviceAlert` now writes email + push to tokens of OTHER active sessions (`exceptSessionId` from event payload), log `channel` = `email`/`push`/`email+push`/`none`; `PushSender` by `PUSH_PROVIDER` (console | expo-batch). Gates: api typecheck/lint clean, jest-unit 929 pass (12 e2e suites fail due to EXTERNAL unfinished build of `ClientProfileController` — not this Slice); web 94/94, mobile 14/14.

## Risks

- [ ] **Mobile session**: push to mobile without permission set — notification only when channel is active
