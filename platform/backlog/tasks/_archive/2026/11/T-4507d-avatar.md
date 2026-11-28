# T-4507d · Avatar (2/8)

- **Stage**: M1 (phase 2) · **Tags**: frontend, design · **Complexity**: junior · **Dependencies**: T-004, T-4506
- **StoryPoints**: 2

## What

`Avatar` in `packages/ui`: photo JS-img with fallback to initials (token-colors from text), sizes from token scale, round/square variants, status indicator (online etc.) by status map. Fallback — mandatory (broken load doesn't give "empty hole").

## Why

Client/barber photos (CRM cards, catalog, chat) need single avatar; local copies break AGENTS gate. Icons from T-4506 used as fallback placeholder (user icon), not hex.

## Requirement sources

- `docs/admin/16-shared.md` (client card, photo)
- `docs/design-system.md` §Components, §Tokens (radii, colors)
- `docs/components/` (component README pattern)

## Done

- [x] Avatar in `packages/ui` (photo → initials → icon fallback)
- [x] Sizes/colors from tokens, no hex in screen code
- [x] Unit tests (photo, fallback, status indicator)
