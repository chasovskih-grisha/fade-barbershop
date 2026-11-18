# T-4718b · Cabinet guard keeps the path

- **Stage**: M1 (phase 3) · **Tags**: frontend, ux · **Complexity**: junior · **Depends on**: T-4718a
- **StoryPoints**: 3

## What

`AccountShell` currently calls `router.push('/login')`. Pass the path the client asked for, through `safeNextPath`, as slice a describes.

- Use the pathname already in the shell. Do not read `window.location`.
- Login already routes to `nextUrl`. Do not add a second redirect after OTP.
- Cover the devices path: signed out, the login URL contains `next=/account/devices`. A value `safeNextPath` rejects does not appear in the URL.

## Why

The helper and the login page already agree. The guard is the piece that drops the path.

## Sources

- T-4718a
- `apps/web/src/app/account/components/AccountShell.tsx`
- `apps/web/src/app/login/useLoginActions.ts`

## Done

- [x] A signed-out visit to `/account/devices` opens `/login?next=/account/devices`
- [x] The same is true for `/account`, `/account/appointments`, and `/account/referrals`
- [x] An unsafe `next` never leaves the guard

## Risks

- [ ] **The guard runs before the session resolves.** It already waits for `isLoading`. Keep that. A slow `/api/auth/me` must not bounce a signed-in client
