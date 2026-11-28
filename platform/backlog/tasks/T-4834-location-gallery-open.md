# T-4834 · The studio gallery opens

- **Stage**: M5 (phase 30) · **Tags**: frontend, ux · **Complexity**: middle · **Depends on**: T-4406, T-4831, T-4850
- **StoryPoints**: 10

## What

`LocationGallery` is a square grid. Captions are `line-clamp-1`. Hover scales the image. Nothing opens. A keyboard user cannot see a photo larger than the cell.

Activating a photo opens it in a dialog at the intrinsic crop, with the full caption, next and previous, and a close control. Escape and the backdrop close it. Focus returns to the photo that was opened. `prefers-reduced-motion` does not scale the thumbnail. An empty gallery renders nothing. Slices: website (T-4834a), app (T-4834b).

## Why

The photos are the room. A 50vw square with a clipped caption is not how a guest checks the entrance.

## Sources

- `apps/web/src/app/locations/[code]/LocationGallery.tsx`
- T-4406 (the photos)
- T-4510c (the reduced-motion pattern)

## Done

- [ ] T-4834a and T-4834b are done
- [ ] An empty `photos` array leaves no gallery heading

## Risks

- [ ] **Focus lost on close.** The trigger that opened the dialog receives focus again

## Out of scope

- Before/after portfolio (T-190, T-191)
- Admin sorting (T-4406, done)
