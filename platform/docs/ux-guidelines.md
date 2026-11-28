# UX guidelines — interface conventions

> **Status:** real minimum, verified by actual code (2026-09-24). Not phantom.
> **Links:** [design-system.md](design-system.md) — tokens, typography, `@fade/ui` components; [web-screens.md](web-screens.md), [booking-flow.md](booking-flow.md) — screen contracts. This document — **interface behavior rules**: states, failures, accessibility, language. Extended when first task touches it.

## 1. Every async block has all states

List/card/detail must have explicit states: **loading** (skeletons from `@fade/ui`, `aria-busy="true"`), **empty** ("No locations yet — opening soon."), **error** ("Failed to load locations." + "Try again" button), **success**. Empty API response — this is empty, not infinite skeleton. Pattern sample: `LocationStep.tsx`.

## 2. Geolocation and failures never block

Geolocation failure/timeout/unavailability → banner message (`GeoLocationBanner`) + regular list. No scenario leaves client without choice (same rule as "nearest locations" use case: unknown city = regular list). Auto geolocation request — once on mount; repeat — by button, reset — by button.

## 3. Accessibility

- **Interface language — Ukrainian** (`<html lang="uk">`); terms — from [ubiquitous-language.md](ubiquitous-language.md) ("Register", "Day off", "Any barber").
- Sections marked with `aria-label` (gallery, working hours); status blocks — `role="status"`.
- Clickable card = semantic element (`Card` with onClick or `Link`); focus and keyboard — like native elements.
- Contrast and sizes — from design-system tokens, not "by eye".
- **Gate (T-4510a):** `pnpm e2e:a11y` runs `axe-core` over the public pages; threshold is zero critical/serious violations. Moderate/minor findings stay for the full audit (T-3501).

## 4. Numbers, time, badges

- Distance: < 1 km → "less than 1 km", further — round to km (`formatDistance`). Distance badge — only when known (`distanceKm !== null`).
- Hours: all 7 days, Monday-first; day off — "Day off" (MNG-ADM-03), time — "HH:MM".
- Day of week everywhere **0=Mon … 6=Sun** (domain convention) — don't confuse with `getDay()`.
- Money: whole cents count in data; display format — design-system.

## 5. Phones, links, external

- `tel:` for phones, `mailto:` for email, `https://t.me/…` for telegram handles (channel value in DB — without "@", display adds).
- External links — with explicit flow exit (OSM map opens new tab).
- Images — `next/image` with allowed hosts in `next.config.js` (`images.remotePatterns`).

## 6. What's checked on review

States 1–3 covered; Ukrainian language without calques; empty/forbidden states not "dead screen"; no block hides content forever via external dependency (geo, map, API). See `review-checklist.md`.
