# ADR 0022: Map and Geocoding Stack — Leaflet + OpenStreetMap behind a `Geocoder` Port

## Status
**Accepted** — 2026-09-23, recorded before T-4405 implementation so the library choice is fixed. Changing provider later is a contained operation (new adapter / map component), not a domain change.

## Context
Location records carry `lat`/`lng` and several surfaces need map + geocoding capabilities:

- **Admin**: pin-pointing a location on a map instead of manual lat/lng inputs, address search (forward geocode), reverse geocode filling address fields (admin-screens §1.2, MNG-ADM-01, T-4405).
- **Public site**: location detail map (web-screens §2) and the geolocation feature shipped 2026-09-23 (`FindNearestLocations` + reverse-geocode city filter), which already introduced the `Geocoder` port (`locations/domain/ports.ts`) with a Nominatim adapter and a fake for tests.
- **Future consumers**: booking flow location step (T-041), GBP (T-260), `LocalBusiness` schema.org (T-2600a), mini-preview in the locations list (§1.1).

Options considered:

- **Option A — Leaflet + OpenStreetMap tiles**: free, no API key, no billing account, works in Ukraine, mature library; OSM/Nominatim public instance has usage limits (≈1 req/s, caching required, identifiable User-Agent mandatory).
- **Option B — Google Maps JS API + Geocoding API**: best map data and geocode quality, but requires API key + billing from day one, per-load cost, and vendor lock-in for both tiles and geocoding.
- **Option C — Mapbox GL**: key required (free tier generous), vector tiles, same vendor/pricing exposure as B.

Constraints: ADR 0018 (Docker dev — no external keys in the dev loop), ADR 0002 (modular monolith — no separate geo service), ADR 0019 (< 100 LOC per file — map lives in the UI kit as a small wrapper, T-004), tests must run without network (fakes only).

## Decision
1. **Map rendering: Leaflet with OpenStreetMap raster tiles** (standard tile layer, mandatory «© OpenStreetMap contributors» attribution on every surface). One thin React wrapper component in the UI kit; Leaflet loaded via dynamic import with `ssr: false` (it touches `window`). No heavy wrapper dependency (react-leaflet) — avoid version churn.
2. **Geocoding behind the existing `Geocoder` port**: **Nominatim adapter is the default** (already implemented for nearest-locations: 3 s timeout, mandatory User-Agent, failure degrades to `null` — never breaks a use case). `FakeGeocoder` for tests and local dev. Respect the usage policy: geocode on submit, cache results, never per-keystroke.
3. **Google Maps stays the pre-approved fallback**: if Nominatim quality/limits prove insufficient (geocode precision, reverse-geocode granularity, rate limits at real traffic), switching means one new `Geocoder` adapter plus swapping the map component's tile/provider — a founder decision, no domain or use-case changes. The port isolates the choice either way.
4. **Coordinate validation stays in the domain**: `Coordinates` VO range checks (and T-4405's Ukraine sanity box as a warning, not a block) — no map library leaks into domain validation.

## Consequences

### Positive
- Zero cost and zero keys at current scale; dev/prod parity without secrets management (ADR 0018).
- Deterministic tests — geocoding is always faked in suites; network adapters are thin and replaceable.
- Provider swap (either direction) is contained: one adapter + one component, per the port boundary. **З 2026-09-24 свап — адмінська дія, не деплой** (MNG-ADM-18): провайдер зберігається в `AppSetting` (`locations.geocoder`), `SettingsRoutingGeocoder` обирає nominatim/google за живим налаштуванням.

### Negative
- Nominatim public-instance limits require discipline: caching layer and submit-only geocoding are mandatory, not optional. **З 2026-09-24 дисципліна автоматизована**: `CachedRateLimitedGeocoder` (TTL-кеш ~110 м-сітки, ковзне вікно лімітів за налаштуванням, tombstone після 3 збоїв) стоїть перед кожним адаптером.
- Map data/UX is a step below Google (search quality, satellite); accepted trade-off for v1 scale.
- Leaflet raster tiles need manual marker/cluster plumbing that Google/Mapbox bundle — acceptable for one picker + one display map.

## Implementation Checklist
- [x] `Geocoder` port + `FakeGeocoder` + Nominatim adapter (nearest-locations, 2026-09-23)
- [x] Кеш + rate limit за портом `Geocoder`; Google-адаптер; адмін-конфіг провайдера (MNG-ADM-18, `AppSetting`) — 2026-09-24
- [ ] Leaflet map-picker component in the UI kit (T-004/T-4405), dynamic import, attribution visible
- [ ] Forward geocode on submit with result cache; reverse geocode fills address fields
- [ ] Public location map (web-screens §2) uses the same component
- [ ] e2e: create location via pin + search; map shows pin on public page and booking step (T-4405 Done)

## References
- T-4405 (implementing task), T-021, T-041, T-260, T-2600a, T-004
- admin-screens §1.2, web-screens §2, MNG-ADM-01
- [Nominatim usage policy](https://operations.osmfoundation.org/policies/nominatim/), [Leaflet](https://leafletjs.com/)
- ADR 0002 (monolith), ADR 0018 (Docker dev), ADR 0019 (file size), ADR 0021 (UUID PKs on `Location`)
