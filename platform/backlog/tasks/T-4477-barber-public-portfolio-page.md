# T-4477 · Barber Public Portfolio Page

- **Stage**: M3 (phase 12) · **Tags**: frontend, public, seo · **Complexity**: middle · **Depends on**: T-030, T-024, T-4610a
- **StoryPoints**: 5

## What

Public portfolio and profile page for each barber on the web showcase (`docs/client-screens.md`):
- Barber profile: photo, bio, years of experience, specialization, customer ratings & reviews (`AggregateRating`, `Review` per T-240).
- Services offered with prices and direct "Book with this barber" CTA button.
- SEO optimization: canonical URL, clean slug translation (T-4413), schema.org structured data (`Person`, `LocalBusiness`), hreflang support (T-4613c/d).
- Responsive mobile & desktop layout.

## Why

Clients often choose a barber based on portfolio and reviews before booking; dedicated SEO landing pages drive organic acquisition.

## Sources

- `client-screens.md`, T-240 (reviews), T-4413 (slugs), T-4610a/b (barber photos/consent)

## Done

- [ ] Barber public profile page with bio, portfolio photos, and reviews
- [ ] Service list with prices and booking deep-link CTA
- [ ] SEO structured data (Schema.org) and canonical slugs
- [ ] Responsive UI tested across devices
