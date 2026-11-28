# T-4822 · The listing card shows the studio, and the logo stays a mark

- **Stage**: M5 (phase 30) · **Tags**: frontend, ux · **Complexity**: middle · **Depends on**: T-4406, T-4609b
- **StoryPoints**: 5

## What

A listing card is type and a logo. The first gallery photo (`photos` sorted by `sortOrder`) becomes the card image, with its caption as the accessible name when a caption exists. `LocationLogo` stays the small mark from T-4609b. No photo means a token surface, not a stock image and not a stretched logo.

## Why

The guest is choosing a room. The logo does not show the room, and the gallery already has the picture.

## Sources

- `apps/web/src/app/locations/page.tsx`
- `apps/web/src/app/components/shell/LocationLogo.tsx`
- T-4406 (gallery data), T-4609b (the mark on the card)

## Done

- [x] The card image is the lowest `sortOrder` photo, cover-cropped, with a fixed aspect so the grid does not jump
- [x] The logo mark remains, at the card size, and is not used as the photograph
- [x] A location with no photos has no broken image and no remote placeholder
- [x] A test covers photo, caption, and the empty gallery

## Risks

- [ ] **A remote photo host blocks the optimizer.** The card uses the same image path the detail gallery already uses

## Out of scope

- Opening the photo (T-4834)
- Replacing the logo component (T-4609b is done)
- Admin upload (T-4406 is done)
