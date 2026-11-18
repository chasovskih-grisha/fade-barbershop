# T-4406 · Location Channels & Gallery Management in Admin

- **Stage**: M2 (phase 7) · **Tags**: backend, frontend, admin · **Complexity**: middle · **Depends on**: T-020, T-3402
- **StoryPoints**: 5

## What

Admin UI and backend support for location gallery and multi-channel publication management:

- Location gallery manager: photo upload (webp, max 5MB, auto-thumbnails), reordering (drag-and-drop), caption editing, tagging (interior, exterior, team, atmosphere).
- Channel visibility flags: control which photos/content appear on website vs mobile app vs booking widget.
- API endpoints for public locations API serving channel-filtered galleries.

## Why

Locations require rich media presentations tailored to different client touchpoints (website showcase, mobile app, booking widget) without hardcoded frontend deployments.

## Sources

- admin-screens.md §3; location domain model

## Done

- [ ] Admin gallery CRUD with photo upload, cropping, and reordering
- [ ] Channel visibility toggles (web, mobile, widget) per gallery item
- [ ] Public API endpoints returning channel-filtered location galleries
- [ ] Image optimization pipeline (WebP conversion, responsive sizes)

## Risks

- [ ] **Storage bloat**: S3 bucket cleanup for deleted images — lifecycle rules and orphaned file garbage collection
