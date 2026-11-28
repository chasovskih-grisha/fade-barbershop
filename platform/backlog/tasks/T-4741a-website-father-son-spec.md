# T-4741a · Specify the website party step

- **Stage**: M1 (phase 3) · **Tags**: frontend, ux · **Complexity**: junior · **Depends on**: T-4741
- **StoryPoints**: 3

## What

Point screen 1b in `docs/booking-flow.md` at the website flow that exists today.

- The step is opt-in. Skipping it leaves a single visit.
- Fields: mode, son's name, one barber or two different barbers.
- The slot that follows uses the duration the party API already books.
- The client must be signed in before submit. If they are not, the commit step sends them through the existing login and returns to this booking. It does not use the admin route.
- The 90-versus-95 note in T-044 is not decided here.

## Why

Screen 1b is written as if the website has it. The website does not, and the only route is an admin route.

## Sources

- T-4741
- `docs/booking-flow.md`
- T-044
- ADR 0011

## Done

- [x] The section states opt-in, the fields, the client session, and the untouched duration question
- [x] `pnpm docs:validate` reports no new error from this file (7 pre-existing errors unchanged: 6× status «qa», 1× unescaped `|` in m5)

## Risks

- [ ] **A new party design.** The section follows ADR 0011 and the use case T-044 shipped
