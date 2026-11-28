# T-4532 · Location-aware quick-booking routing

- **Stage**: M1 (phase 4; entry surface for marketing site) · **Tags**: frontend, marketing · **Complexity**: middle · **Dependencies**: T-021, T-030, T-053
- **StoryPoints**: 5

## What

Canonical quick-booking route **`https://fade.com.ua/booking/{location-code}`**, where `location-code` — stable location code, not internal UUID:

- `https://fade.com.ua/booking/` shows all active locations as clickable items; card choice leads to this location's canonical URL.
- `https://fade.com.ua/booking/{location-code}` server-side recognizes code via existing `GET /locations/{code}`, substitutes location, skips location choice step and opens services step for it.
- All location-aware CTAs of public site and GBP profiles generate canonical path URL; UTM parameters from T-053 preserved.
- Old `?location={code}` and common `?locationId={id}` cases redirected to canonical path without attribution loss.
- Unknown or disabled code not substituted with another location: explicit 404/return to choice with clear state.

## Why

Each point in Google Maps must lead directly to correct flow, without location search in list. Global root link from ads, QR or brand site must give clear choice of all active locations. Public stable code also separates marketing link from internal booking identifier.

## Requirement sources

- Founder decision 2026-09-25: `https://fade.com.ua/booking/{location-code}` and locations list on `https://fade.com.ua/booking/`
- `docs/acceptance-criteria/20-gbp-integration.md`: GBP-001, GBP-ADM-02; T-260
- T-021 (location code), T-030 (location-aware CTA), T-053 (quick-booking and UTM)
- `docs/booking-flow.md` — screen 0; current `GET /locations/{code}` and web booking flow

## Done

- [ ] `fade.com.ua/booking` shows all active locations; each item has real href to `/booking/{location-code}` and works by keyboard
- [ ] `/{location-code}` validates code, substitutes exactly this location, skips location choice and loads its services/prices
- [ ] All location CTAs and GBP profiles use canonical path URL; internal UUID doesn't get into public link
- [ ] Legacy query links redirected to canonical path with UTM preserved; unknown/disabled code not substituted
- [ ] Static/reserved routes have priority and don't conflict with dynamic location code
- [ ] Auto tests: root list, each active code, region/case normalization, unknown/disabled code, legacy redirect + UTM, location-scoped API requests
- [ ] Verified in browser on desktop and mobile; direct click from Google Maps leads to correct location

## Risks

- [ ] **Route collision**: generic `/{slug}` may intercept future manage/payment routes — dynamic route accepts only valid location code, static routes have priority
- [ ] **Attribution loss**: redirect doesn't change UTM and `google` source; canonicalization shouldn't break QR/ad links T-053
- [ ] **Implicit substitution**: unknown/inactive code can't be turned to "nearest" location without explicit client choice
