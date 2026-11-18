# T-070 · Client Mobile Shell (tabs, login, push tokens)

- **Stage**: M2 (phase 6) · **Tags**: frontend · **Complexity**: middle · **Depends on**: T-010, T-001
- **StoryPoints**: 5

## What

Expo shell for `client` role (`client-screens.md`): tabs Home/Locations/Services/My Visits/Profile, OTP login (same `User`), push token registration (Expo Notifications), disabled items are hidden. Blog — feed with `content`.

## Sources

- `client-screens.md` (navigation, §1–3, §5); products.md §3; ADR 0004/0005

## Done

- [x] Login and tabs work; push tokens are registered
- [x] Home/locations/services return API data

## Progress

- **2026-10-07 — client push token registration (push channel T-4422)**: `[push-tokens.ts](/platform/apps/mobile/src/lib/api/push-tokens.ts)` — `registerPushToken(accessToken, token, platform?)` → `POST /identity/client/push-tokens` and `revokePushToken` → `/revoke` (Bearer access token, platform is added only when passed). Server side: Expo token is unique, bound to session; re-registration rebinds the row. Tests: 5 cases on global.fetch, mobile 14/14. **Remaining**: integration into Profile screen with `expo-notifications` (currently in deps none) and displaying device list on mobile (T-4422).

## Risks

- [ ] **Migrations**: schema changes break existing data — migration with backfill plan
- [ ] **Domain events**: subscriptions are idempotent (ADR 0009/0016 pattern)
