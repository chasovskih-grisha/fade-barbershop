# T-053 · Quick-booking `fade.com.ua/booking`: 5-step booking

- **Stage**: M1 (phase 4) · **Tags**: frontend, backend · **Complexity**: middle · **Depends on**: T-041, T-040, T-022, T-023
- **StoryPoints**: 95 (sum of slices a–w; own estimate of 5 SP does not count while children exist)

## What

Quick-booking — route **`https://fade.com.ua/booking`** in `apps/web` (ADR 0017, revision 2026-10-01). There is no separate `book.fade.com.ua` host and no separate `apps/book` app. This route has no menu, blog, gallery, or showcase footer. 5-step flow: **service → barber (default "Any", step skipped with a single tap) → time → phone (+38, 6-digit OTP per ADR 0005) → confirmation**. Status "Booked" + add-to-calendar. Deposit — **the same as in the main flow** (single money policy for all channels): price snapshot (ADR 0006) and deposit via PAY/DSC, Apple/Google Pay sheet.

Canonical URLs: `https://fade.com.ua/booking` (location list) and `https://fade.com.ua/booking/{location-code}` (T-4532). English locale — `/en/booking/...`.

**UTM parser on entry:** URL without tags → **default `utm_content=direct`** (+ paired `utm_source=direct`/`utm_medium=none` per GA4 convention) — direct entries (business card links, browser history, someone sharing a "naked" link) are visible in analytics as a separate segment rather than getting lost in `(not set)`. Partial tags (has `utm_source`, no `utm_content`) are not overwritten — `utm_content` remains empty to avoid mixing advertising with direct entries. The value is stored on the booking — touchpoint/channel attribution is read from the booking, not the session. Booking intent is a path starting with `/booking` plus UTM on the visit. A separate host is not required.

Design: H1 "Everything is in place.", subtitle "Booking in 60 seconds"; tokens from `packages/design-tokens` (monochrome-first), CTA — Bone/Night inversion, focus-visible — `accent.blue`. No parallel validator: UI is a thin layer over the same `scheduling`/`billing` use cases as T-041 (lesson of ADR 0020 — do not bypass domain logic).

## Why

Main scenarios are context-free: click from Instagram/Facebook creative, QR on business card/mirror in the shop, link in bio. Decision in 5 seconds — 4 choices needed, nothing more. Minimalism discipline — layout of the `/booking` route (heavy marketing shell does not leak). Ad conversion is read from UTM on the booking and from the `/booking` path.

## Sources

- Founder decision 2026-09-21 (quick-booking, deposit = main flow) and **2026-10-01** (booking on `fade.com.ua/booking`, `book` host removed) — `00-brief/decisions-log.md`, ADR 0017
- `marketing/channels/qr-booking-touchpoints.md` — QR touchpoints with UTM (registry of touchpoints and tags; codes generated before release — start with analytics from day one)
- `booking-flow.md` (service/barber/slot/phone/confirmation screens — same states, composed linearly)
- `design-system.md` §Tokens; DSC-006 (price breakdown), PAY-WEB (payment states)

## Done

- [ ] 5-step flow works: service → barber ("Any" — default and skip) → time → phone → confirmation
- [ ] Route `/booking` does not inherit header, menu, and showcase footer; `apps/book` is not created
- [ ] Used use cases T-041/T-040 directly — no copies of domain logic
- [ ] UTM parser correctly sets `utm_content=direct` on empty UTMs and preserves partial ones
- [ ] UI built with monochrome tokens and accessible focus states

## Risks

- [ ] **Scope creep**: keeping quick-booking free of blog/gallery/footer bloat
