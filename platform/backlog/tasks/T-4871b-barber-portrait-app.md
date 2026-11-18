# T-4871b · Slice: the portrait on the app barber card and screen

- **Stage**: M5 (phase 30) · **Tags**: frontend, ux, mobile · **Complexity**: junior · **Depends on**: T-4871, T-4866, T-4867, T-4869
- **StoryPoints**: 3

## What

The app card and the app screen show the photo from the payload, or initials. No gradient over the face.

## Why

The phone is the surface where the face is the whole card.

## Sources

- T-4871
- T-4869

## Done

- [ ] A photo renders in the frame
- [ ] A null photo renders initials
- [ ] A test covers both

## Risks

- [ ] **A large photo blocking the list.** The card uses a fixed frame. The full image waits for the screen

## Out of scope

- The website portrait (T-4871a)
