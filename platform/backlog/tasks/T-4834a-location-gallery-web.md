# T-4834a · Slice: gallery dialog on the website

- **Stage**: M5 (phase 30) · **Tags**: frontend, ux, a11y · **Complexity**: middle · **Depends on**: T-4834
- **StoryPoints**: 5

## What

The website gallery keeps the grid and adds the dialog described on T-4834. Thumbnails stay two columns on a narrow viewport and three on a wide one. The caption under the thumbnail may stay short; the dialog shows the full caption.

## Why

The component already receives captions and then hides them.

## Sources

- T-4834
- `apps/web/src/app/locations/[code]/LocationGallery.tsx`

## Done

- [ ] Enter and click open the dialog on that photo
- [ ] Escape closes it and restores focus
- [ ] Next and previous wrap inside the sorted list
- [ ] Reduced motion disables the hover scale
- [ ] A test covers open, caption, close, and the empty list

## Risks

- [ ] **The dialog under the sticky book bar.** The dialog is a layer above the bar from T-4831

## Out of scope

- The app gallery (T-4834b)
