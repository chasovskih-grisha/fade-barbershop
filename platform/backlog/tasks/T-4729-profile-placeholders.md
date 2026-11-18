# T-4729 · The profile stops showing empty programs

- **Stage**: M1 (phase 3) · **Tags**: frontend, ux · **Complexity**: middle · **Depends on**: T-032
- **StoryPoints**: 8

## What

`AccountPlaceholders` renders four empty cards on every website profile: reviews, loyalty, referrals, and certificates. Referrals already have `/account/referrals`. The other three are other tasks (reviews, loyalty, certificates) and the screen spec says a section with no data is hidden.

Remove the three empty cards. Replace the referrals card with a link «Реферальна програма» to `/account/referrals`, where that page already lives. Do not build the loyalty progress, the review list, or the certificate wallet here.

The app profile does not gain those four cards. The app has no referrals route, so it does not gain a referrals link either.

## Why

Four dead cards tell the client the programs exist and then offer nothing. One of them hides a page that already works.

## Sources

- `apps/web/src/app/account/AccountPreferencesCard.tsx`
- `apps/web/src/app/account/referrals/page.tsx`
- `docs/client-screens.md` §5
- `docs/web-cabinet-screens.md` §2

## Done

- [ ] Slices a, b, and c are `done`
- [ ] The website profile has no empty reviews, loyalty, or certificates card
- [ ] «Реферальна програма» opens `/account/referrals`
- [ ] The app profile does not grow the four cards

## Risks

- [ ] **Building the programs.** Loyalty stays T-142. Reviews stay T-151. Certificates stay their gift task. This task only removes the pretence
- [ ] **An app referrals screen.** There is no route. Do not add one in this task

## Out of scope

- The next-visit card (T-4716)
- Referral program rules
