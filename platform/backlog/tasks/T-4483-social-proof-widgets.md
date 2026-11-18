# T-4483 · Social proof micro-widgets

- **Stage**: M5 (phase 10) · **Tags**: backend, frontend, marketing · **Complexity**: junior · **Depends on**: T-030, T-240
- **StoryPoints**: 3

## What

Micro-widgets on pages (service, location, cassette): "N bookings this week", "latest review", "this master has 4.9★", without personal data or meta-imitation. Display real data from aggregates (T-4467), UA cache, click → reviews list.

## Why

Social proof from real numbers is more convincing than empty banners; micro-widgets complement reviews (T-240) on "cold" pages.

## Sources

- web-screens.md; T-030 (public data), T-240 (reviews), ux-guidelines

## Done

- [ ] Widgets (weekly bookings/review/rating) on key pages
- [ ] Data aggregated by event, with cache; no PII
- [ ] Click leads to reviews list (T-240)

## Risks

- [ ] **Fictionality**: number of "bookings" without connection to real data = deception; aggregates only
