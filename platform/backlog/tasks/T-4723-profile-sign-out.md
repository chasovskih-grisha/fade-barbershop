# T-4723 · Sign out is one action, separate from notifications

- **Stage**: M1 (phase 3) · **Tags**: frontend, ux · **Complexity**: middle · **Depends on**: T-032, T-072, T-4722a
- **StoryPoints**: 8

## What

The website cabinet has two controls labelled "Sign out": one in the profile header and one in the aside. The app profile's only exit is "Sign out and disable notifications", which revokes push.

One sign-out on each surface. On the site, keep the aside button and remove the one in the profile header. On the app, "Sign out" signs out and does not revoke push by itself. Turning notifications off stays the push switch from T-4722.

Both ask "Sign out of this device?" before they do it. Cancel stays on the profile. Confirm ends the local session and opens sign-in. It does not call revoke-all. Other devices stay signed in. That list is T-4724.

## Why

Two identical buttons, and a third that also kills notifications, make the client guess what "Sign out" will do.

## Sources

- `apps/web/src/app/account/page.tsx`
- `apps/web/src/app/account/components/AccountShell.tsx`
- `apps/mobile/src/app/(client)/account/profile/index.tsx`

## Done

- [ ] Slices a, b, and c are `done`
- [ ] The site profile has one "Sign out", in the aside
- [ ] The app "Sign out" does not change the push switch
- [ ] Cancel leaves the session as it was

## Risks

- [ ] **Signing out every phone.** Confirm is this device. Revoke-all stays on the devices screen
- [ ] **A confirm on every navigation.** Only the sign-out control asks

## Out of scope

- Unsaved field warnings (T-4733). Sign-out does not wait for them
- Device list (T-4724)
