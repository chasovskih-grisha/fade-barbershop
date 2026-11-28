# T-4841 · The studio link preview uses a photo of the studio

- **Stage**: M5 (phase 30) · **Tags**: frontend · **Complexity**: junior · **Depends on**: T-4508, T-4822
- **StoryPoints**: 3

## What

`pageMetadata` accepts an `image`. The studio page does not pass one, so a shared link has no preview of the room. When the gallery has a photo, `og:image` is the first photo by `sortOrder`. When it does not, the tag is omitted. The Schema.org `logo` stays the mark from T-4609b.

## Why

A message with the link currently previews the site default, not the studio the sender meant.

## Sources

- `apps/web/src/lib/metadata.ts`
- `apps/web/src/app/locations/[code]/page.tsx`
- T-4609b (schema logo)

## Done

- [ ] A studio with photos sets `og:image` to the first photo
- [ ] A studio without photos does not invent an image URL
- [ ] Schema.org `logo` is unchanged
- [ ] A test covers both payloads

## Risks

- [ ] **A photo host that messengers cannot fetch.** The URL is the public photo URL the gallery already uses. This task does not proxy it

## Out of scope

- The share control (T-4840)
- Rebuilding the logo (T-4609b)
