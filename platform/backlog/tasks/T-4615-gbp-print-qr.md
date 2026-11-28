# T-4615 · Print QR for Google Business Profile reviews

- **Stage**: M1 (phase 24) · **Tags**: frontend · **Complexity**: junior · **Depends on**: T-260
- **StoryPoints**: 2

## What

GBP-ADM-03: Print QR in admin dashboard — location choice leads to PNG/SVG `GbpReviewUrl` with brand frame and download button.

## Requirement sources

- `GBP-ADM-03`; `20-gbp-integration.md`

## Done

- [ ] Admin can select location and download branded QR code (PNG/SVG) pointing to `GbpReviewUrl`

### Re-verified at 78dab8f8 (2026-11-26)

- `grep -ci gbp apps/api/prisma/schema.prisma` → `0`: there is no GBP column on `Location`, and
  `apps/api/src/locations` exposes no review-URL field, so a print QR has nothing to encode.
- The data owner is T-260 (`backlog/index/m3.md` → `todo`), a backend row; this one is `frontend`.
- Unblock: T-260 lands `gbpReviewUrl` on `Location`, `@fade/contracts` exposes it, and the QR screen
  reads it.
