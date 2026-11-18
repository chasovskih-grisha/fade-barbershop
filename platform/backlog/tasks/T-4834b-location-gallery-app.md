# T-4834b · Slice: gallery on the app studio screen

- **Stage**: M5 (phase 30) · **Tags**: frontend, ux, mobile · **Complexity**: middle · **Depends on**: T-4834, T-4844, T-4850
- **StoryPoints**: 5

## What

The app studio screen shows the same sorted photos. A tap opens a full-screen viewer with the caption, next, previous, and close. The system back control closes the viewer and stays on the studio screen.

## Why

The photos are already on the public payload. The app has nowhere to show them.

## Sources

- T-4834
- T-4844

## Done

- [ ] Photos render in `sortOrder`
- [ ] The viewer shows the full caption
- [ ] Back from the viewer returns to the studio screen, not to the home list
- [ ] No photos omit the section

## Risks

- [ ] **A large photo on a slow network.** The thumbnail shows first; the viewer waits. A failed image is a token surface, not a broken icon with no name

## Out of scope

- The website dialog (T-4834a)
