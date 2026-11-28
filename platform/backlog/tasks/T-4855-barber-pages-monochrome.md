# T-4855 · The barber pages use the night system

- **Stage**: M5 (phase 30) · **Tags**: frontend · **Complexity**: middle · **Depends on**: T-004
- **StoryPoints**: 5

## What

`/barbers` paints a blue blur orb, `fade-card-gradient`, `accent-blue` pills, `tracking-wider`, and `text-[2.75rem]`. The card adds a pulsing dot, a blue glow, and a gradient over the portrait. `docs/design-system.md` forbids gradients in UI and limits `accent.blue` to the AI flow and focus.

Both `/barbers` and `/barbers/{slug}` use surface, line, and type tokens. The arbitrary sizes, the blur, the pulse, and `border-border` on the services link leave these routes.

## Why

These two routes are the people of the brand, and they are the pages currently breaking the night system.

## Sources

- `docs/design-system.md` §Кольори
- `apps/web/src/app/barbers/page.tsx`
- `apps/web/src/app/barbers/BarberCard.tsx`
- `apps/web/src/app/barbers/[slug]/BarberDetailContent.tsx`

## Implementation plan

Paths:
- apps/web/src/app/barbers/BarberCard.tsx
- apps/web/src/app/barbers/BarbersClient.tsx
- apps/web/src/app/barbers/BarbersMasterclassVIPShowcase.tsx
- apps/web/src/app/barbers/[slug]/BarberDetailContent.tsx
- apps/web/src/app/barbers/__tests__/night-system.test.ts

Checks:
- `npx jest --config apps/web/jest.config.js --runTestsByPath apps/web/src/app/barbers/__tests__/night-system.test.ts`

## Done

- [ ] Neither route uses a gradient, a blur orb, `animate-pulse`, or `accent-blue` as decoration
- [ ] Type on these routes comes from the existing tokens
- [ ] A test or lint check fails if those classes return to the three files

## Risks

- [ ] **The portrait going flat.** The photo stays a photo. This task removes the veil, which T-4871 specifies, and does not remove the image

## Out of scope

- Retheming the product (T-2100)
- Booking-screen phantom classes (T-053w)

## QA

- `npx jest --config apps/web/jest.config.js --runTestsByPath apps/web/src/app/barbers/__tests__/night-system.test.ts` exit 0
