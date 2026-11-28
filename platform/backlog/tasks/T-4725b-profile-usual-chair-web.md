# T-4725b · Usual chair on the website profile

- **Stage**: M1 (phase 3) · **Tags**: frontend, ux · **Complexity**: middle · **Depends on**: T-4725a
- **StoryPoints**: 5

## What

Add the two fields to the website profile. Options come from the location and barber lists booking already loads. Include an empty option labelled «Не обрано». Persist the ids on the client profile. Render «Більше не доступно» when an id is missing from the list, with a clear control.

## Why

The website profile is where the account fields already live.

## Sources

- T-4725a
- `apps/web/src/app/account/page.tsx`

## Done

- [ ] «Не обрано» saves empty and reloads empty
- [ ] A missing id shows «Більше не доступно» and can be cleared
- [ ] Saving does not call a booking update

## Risks

- [ ] **Defaulting the select.** The control's first real option must not be submitted just because the client opened the page

## Re-verified at 91202f68

Blocked at `91202f68` by `Depends on: T-4725a`, which sits in `review` with a docs-only review
commit (`92199659`). `claimBlock` only accepts `done`/`split` dependencies. Unblocks when T-4725a is
split or closed.
