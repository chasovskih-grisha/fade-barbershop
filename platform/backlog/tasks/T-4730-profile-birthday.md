# T-4730 · An optional birthday on the profile

- **Stage**: M1 (phase 3) · **Tags**: frontend, ux · **Complexity**: middle · **Depends on**: T-032, T-072
- **StoryPoints**: 8

## What

The profile has no birthday. Campaigns that mention a birthday (T-4459) have nothing the client chose to share.

Add an optional day and month on both profiles. Year is not asked. Empty is allowed and is the default. The client can clear a saved date. The profile stores it and shows it as «12 листопада», with no year. It does not send a message, a discount, or a push. T-4459 owns sending.

The date is not shown on public pages or to other clients.

## Why

A birthday campaign without a date the client entered will guess, or it will not run. The profile is where the client decides to share the day.

## Sources

- `docs/web-cabinet-screens.md` §2
- `docs/client-screens.md` §5
- T-4459

## Done

- [ ] Slices a, b, and c are `done`
- [ ] Day and month save, reload, and clear on both surfaces
- [ ] No year field
- [ ] Saving a birthday does not send a message

## Risks

- [ ] **A campaign.** Storing the date does not enroll the client in T-4459
- [ ] **A birth year.** Do not ask for one. Age is not needed for a greeting

## Out of scope

- T-4459 delivery
- Admin editing the date
- Showing the date on a public profile
