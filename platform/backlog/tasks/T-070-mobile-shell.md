# T-070 · Client Mobile Shell (tabs, login, push tokens)

- **Stage**: M2 (phase 6) · **Tags**: frontend · **Complexity**: middle · **Depends on**: T-010, T-001
- **StoryPoints**: 5

## What

Expo shell for `client` role (`client-screens.md`): tabs Home/Locations/Services/My Visits/Profile, OTP login (same `User`), push token registration (Expo Notifications), disabled items are hidden. Blog — feed with `content`.

## Sources

- `client-screens.md` (navigation, §1–3, §5); products.md §3; ADR 0004/0005

## Done

- [x] Login and tabs work
- [ ] Push tokens are registered from a real Expo token (currently `mock-token`)
- [x] Home/locations/services return API data

## Audit 2026-11-24

Reopened. `apps/mobile/src/app/index.tsx` still calls
`registerPushToken('mock-token', 'mobile')`; the real helpers in
`src/lib/push-token.ts` and `src/lib/notifications.ts` are not wired into the
screen. The Done claim “push tokens are registered” is false. Remaining:
permission request, real `getExpoPushTokenAsync`, registration after a session
exists, revoked/denied state, and a device test. Transport/server ownership stays
with T-4422.

## Progress

- **2026-10-07 — client push token registration (push channel T-4422)**: `[push-tokens.ts](/platform/apps/mobile/src/lib/api/push-tokens.ts)` — `registerPushToken(accessToken, token, platform?)` → `POST /identity/client/push-tokens` and `revokePushToken` → `/revoke` (Bearer access token, platform is added only when passed). Server side: Expo token is unique, bound to session; re-registration rebinds the row. Tests: 5 cases on global.fetch, mobile 14/14. **Remaining**: integration into Profile screen with `expo-notifications` (currently in deps none) and displaying device list on mobile (T-4422).

- **2026-11-26 — мобільний дім показує стан push-каналу**: реєстрація Expo-токена йде з хука `usePushRegistration` після появи сесії (`index.tsx` → `push.register(session.accessToken)`), мок-токена в дереві немає. Додано те, чого бракувало аудиту: платформа пристрою береться з `Platform.OS` (раніше завжди `ios`), відмова в дозволі більше не блокує повторну спробу (той самий сеанс після ввімкнення дозволу в налаштуваннях), порожній токен теж лишає спробу відкритою, а головний екран показує `push-permission-notice` з кнопкою «Увімкнути сповіщення» замість тихого ігнорування. Тести: `use-push-registration.permission.test.ts` (Android-платформа, повтор після відмови, порожній токен), `index-home.test.tsx` (банер + повторна спроба, тиша при дозволі), `client-shell.test.tsx` (стан доходить до екрана). Мобільні 61 набір / 264 тести, typecheck чистий. Лишається: перевірка на фізичному пристрої (EAS projectId) — тому пункт Done не закритий.

## Risks

- [ ] **Migrations**: schema changes break existing data — migration with backfill plan
- [ ] **Domain events**: subscriptions are idempotent (ADR 0009/0016 pattern)
