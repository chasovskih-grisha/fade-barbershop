# T-4724 · The profile points at this device

- **Stage**: M1 (phase 3) · **Tags**: frontend, ux · **Complexity**: middle · **Depends on**: T-032, T-072
- **StoryPoints**: 8

## What

The site has `/account/devices` and the app has `(client)/account/devices`. Both can list sessions and revoke the others. The profile never mentions them. A client looking at the account section cannot see which phone they are on.

Add one row on each profile: the current session's channel, the words «Цей пристрій», and a link to the devices screen that already exists. If other sessions exist, the row adds «Ще {N}». The row does not list them and does not revoke them. Failure to load sessions hides the count and still links to the devices screen.

## Why

Sign-out of other phones already exists one navigation away. The profile, which is where the client looks for account safety, does not point at it.

## Sources

- `apps/web/src/app/account/devices/page.tsx`
- `apps/mobile/src/app/(client)/account/devices/page.tsx`
- `docs/web-cabinet-screens.md` §2

## Done

- [ ] Slices a, b, and c are `done`
- [ ] Each profile links to its existing devices screen
- [ ] The row does not grow a second device list

## Risks

- [ ] **Rebuilding devices.** The row is a summary and a link. The list, the confirm, and revoke-all stay on the devices screen
- [ ] **Treating a failed load as zero other devices.** Hide the count. Do not say «Ще 0»

## Out of scope

- Sign-out of this device (T-4723)
- A new session model
