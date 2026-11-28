# T-4833a · Slice: one phone and a channel row on the website

- **Stage**: M5 (phase 30) · **Tags**: frontend, ux · **Complexity**: middle · **Depends on**: T-4833
- **StoryPoints**: 5

## What

Rebuild the contacts region of the studio page. Phone is one control in the action row. Remaining channels are a row; each has a visible name and hits the existing `channelHref`. The listing card keeps its phone link and does not grow a channel row.

## Why

The studio page is where the guest decides to call or to open Instagram.

## Sources

- T-4833
- `apps/web/src/app/locations/[code]/LocationChannels.tsx`

## Done

- [x] One phone number produces one `tel:` control
- [x] Instagram and Telegram render as named controls with their existing hrefs
- [x] A channel list with no entries omits the region
- [x] Targets meet the touch minimum in `docs/ux-guidelines.md`
- [x] A test covers phone-only, phone-plus-instagram, and empty

## Risks

- [ ] **External links without an accessible name.** The visible name is the channel, not the raw handle alone

## Out of scope

- The app row (T-4833b)
- A new icon set (T-4506 is done; use those icons)
