# T-4718 · Sign-in returns to the cabinet page that asked

- **Stage**: M1 (phase 3) · **Tags**: frontend, ux · **Complexity**: junior · **Depends on**: T-032
- **StoryPoints**: 5

## What

The cabinet guard sends every signed-out visit to `/login` and drops the path. Login then opens `/account/appointments`, because that is its default. A client who opened «Пристрої» or «Реферали» comes back to the visit list.

`safeNextPath` already accepts an internal path and rejects an external one. The guard should pass the cabinet path the client asked for. Login already follows `next`.

## Why

The visits page spec already says `/login?next=/account/appointments`. The guard does not do that, and it treats devices and referrals the same way: the client loses the page.

## Sources

- `apps/web/src/app/account/components/AccountShell.tsx`
- `apps/web/src/app/login/useLoginActions.ts`
- `docs/web-cabinet-screens.md` §3
- ADR 0005

## Done

- [ ] Slices a and b are `done`
- [ ] Opening `/account/devices` while signed out returns there after OTP
- [ ] A `next` that is not an internal path is ignored

## Risks

- [ ] **A loop.** `next` must not be `/login`. `safeNextPath` is the check. Do not add a second allowlist
- [ ] **Booking state.** This task does not put `/booking` into `next`. That rule is T-4715a

## Out of scope

- The header mark and which public pages pass `next` (T-4715)
- Restoring a half-finished booking
- Admin sign-in. The admin header already names the operator
