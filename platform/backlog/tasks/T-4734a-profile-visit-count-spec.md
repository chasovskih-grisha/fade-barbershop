# T-4734a · Specify the visit count

- **Stage**: M1 (phase 3) · **Tags**: frontend, ux · **Complexity**: junior · **Depends on**: T-4734
- **StoryPoints**: 2

## What

Add the line to `docs/web-cabinet-screens.md` §2 under the account section, and point `docs/client-screens.md` §5 at it.

- «Візитів: N» from past visits.
- Zero stays visible.
- Load failure hides the line.
- It is not a list and not the next-visit card.

## Why

A count without the zero rule gets hidden for new clients, and a count without the error rule shows a confident zero when the request failed.

## Sources

- T-4734
- `docs/web-cabinet-screens.md` §2

## Done

- [ ] §2 states the sentence, zero, and the error
- [ ] §5 points at §2
- [ ] `pnpm docs:validate` reports no new error from these files

## Risks

- [ ] **Counting upcoming visits.** N is past visits only
