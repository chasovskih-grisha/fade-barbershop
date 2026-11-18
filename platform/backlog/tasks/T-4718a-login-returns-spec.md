# T-4718a · Specify the cabinet return path

- **Stage**: M1 (phase 3) · **Tags**: frontend, ux · **Complexity**: junior · **Depends on**: T-4718
- **StoryPoints**: 2

## What

In `docs/web-cabinet-screens.md` §1, the success line already allows `?next=`. Add the guard rule next to it.

- A signed-out request for a cabinet path redirects to `/login?next=` that path.
- The paths are `/account`, `/account/appointments`, `/account/devices`, and `/account/referrals`.
- `next` goes through `safeNextPath`. Anything else uses the login default, `/account/appointments`.
- `/login` is never a `next`.
- §3 keeps its line about the visits page. It is the same rule, not a second one.

## Why

§3 mentions `next` only for visits. Devices and referrals fall off the end of that sentence.

## Sources

- T-4718
- `docs/web-cabinet-screens.md` §1 and §3
- `apps/web/src/app/login/useLoginActions.ts`

## Done

- [x] §1 states the guard rule and the four paths
- [x] §3 still points at the same rule
- [x] `pnpm docs:validate` reports no new error from this file

## Risks

- [ ] **Two redirect stories.** The visits bullet and the guard rule must name the same helper
