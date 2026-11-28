# T-053b · Booking ships as the `web` image, no `book` Dockerfile

- **Stage**: M1 (phase 4) · **Tags**: infra, devops · **Complexity**: junior · **Depends on**: T-053a
- **StoryPoints**: 2

## What

ADR 0017 (revision 2026-10-01) removed the `book` host: quick-booking lives at `/booking`
inside `apps/web`. This slice closes the deployment consequence — no `apps/book` app and
no `infra/book.Dockerfile`; the single `infra/web.Dockerfile` builds both stages and both
compose files run `web` from it.

## Why

A second Next image would duplicate the same build and drift from the public site.

## Sources

- T-053a, ADR 0017 (revision 2026-10-01), ADR 0018
- `infra/web.Dockerfile`, `infra/docker-compose.yml`, `infra/docker-compose.prod.yml`
- `apps/web/src/app/booking/`

## Done

- [x] No `apps/book`; booking routes live in `apps/web/src/app/booking`
- [x] No `infra/book.Dockerfile`; `infra/web.Dockerfile` is the only booking image
- [x] Multi-stage build (dev + prod, T-4614a) in `infra/web.Dockerfile`
- [x] Dev compose runs `web` with `target: dev`; prod compose runs `web` with `target: prod`
- [x] Web environment variables configured in both compose files
- [x] No `book` service in either compose file

## Risks

- [x] **Image size**: booking adds routes to the existing `web` bundle, not a second image.

## Status

- Reconciled 2026-11-25: the slice is already satisfied in the tree. The previous body
  described a separate `book` Dockerfile that ADR 0017 removed.
