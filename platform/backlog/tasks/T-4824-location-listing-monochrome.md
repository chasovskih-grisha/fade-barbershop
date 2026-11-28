# T-4824 · The location listing uses the night system, not a blue poster

- **Stage**: M5 (phase 30) · **Tags**: frontend · **Complexity**: middle · **Depends on**: T-004, T-4506
- **StoryPoints**: 5

## What

`locations/page.tsx` paints the hero and every card with blue blur orbs, `fade-card-gradient`, `accent-blue` eyebrows, `tracking-wider`, `px-4.5`, and a pulsing dot. `docs/design-system.md` forbids gradients in UI and limits `accent.blue` to the AI flow and `focus-visible`. Depth is a surface step and a 1px line.

The listing hero and cards use `surface`, `line`, and `fg` tokens. The internal label «CLT-01» is not a guest eyebrow. Decorative blur, gradient, pulse, and arbitrary type sizes leave this route.

## Why

The listing is the first public directory. It currently breaks the system the other public pages are held to.

## Sources

- `docs/design-system.md` §Кольори
- `apps/web/src/app/locations/page.tsx`
- T-053w (phantom classes on booking screens — a different route)

## Done

- [ ] The listing route has no gradient, no blur orb, no `accent-blue` fill, and no `animate-pulse`
- [ ] Guest copy does not contain «CLT-01»
- [ ] Type and space on this route come from the existing tokens, not `text-[2.75rem]` or `px-4.5`
- [ ] A test or lint check fails if those classes return to `locations/page.tsx`

## Risks

- [ ] **A flat page with no hierarchy.** Hierarchy stays: display title, then the city groups from T-4821, then the card. This task does not remove the title

## Out of scope

- Retheming the whole product (T-2100)
- Booking-screen phantom classes (T-053w)
- The facts on the card (T-4820) and the photo (T-4822)
