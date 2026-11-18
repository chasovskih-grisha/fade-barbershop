# 20. Google Business Profile (GBP) integration

> Feature: local SEO — main channel where barbershop clients find point. Two integrations: **booking link** in location profile (deep link in booking flow) and **review flow** — push after visit completion with deep link to location's GBP profile (client choice, not our data export). GBP data not synced to `feedback` and vice versa.
>
> Contexts: **without new context**. `notifications` — push template with deep link; `locations` — GBP links field on location (admin); `scheduling` — same `AppointmentCompleted` trigger (one trigger, two channels — private `feedback` and public GBP by client choice). External system (Google) — **outside ACL API**: integration configurational (links), not API client.

## Rule (common)

- [ ] **GBP-001.** **Booking link**: in each location's GBP stands canonical deep link **`https://fade.com.ua/booking/{location-code}`** ("Register" CTA in profile). Guest from Google search/maps falls directly into booking flow with substituted location (step 0 skipped, further — regular path). **`https://fade.com.ua/booking`** shows clickable list of all active locations; card choice leads to this location's canonical URL. Unknown or disabled code not substituted with another location.
- [ ] **GBP-002.** **Profile display**: each `Location` has optional fields `GbpProfileUrl` and `GbpReviewUrl` (admin, MNG-ADM-01 semantics). Disabled location → links not used in messages (Google profile maintained manually outside platform — disable in admin doesn't disable Google).
- [ ] **GBP-003.** **Push deep link GBP after visit**: in same push `AppointmentCompleted` that invites to leave private review (`FDB-MOB-02`), there's **second button** "Rate on Google" → location's `GbpReviewUrl`. Both buttons **always together and equal** — client chooses channel themselves.
- [ ] **GBP-004.** **No gating** (forbidden by Google, 2026-update): channel choice, text and send fact **don't depend** on private rating, review status or any "who deserves invitation" filter. Don't show GBP button only to satisfied, not "funnel" negative into private channel — this is gating and profile deletion risk. Review quotas also forbidden.
- [ ] **GBP-005.** **No import**: Google reviews not loaded into `feedback` (private by FDB-006 decision, different consent model, Google ToS against scraping). Platform reviews not auto-published to Google (moderation, consent — different mechanism).
- [ ] **GBP-006.** **Transition analytics** (ANL extension): clicks on GBP deep link (from search → flow start → completed visits) — UTM on booking link; clicks "Rate on Google" relative to push. Visit source `google` added to `online`/`walk-in` (WALK-ADM-03 semantics) — only for GBP transitions, not organic.
- [ ] **GBP-007.** **QR coding in salon** (print): QR on mirror/stand → `GbpReviewUrl` of location (public, without deep link into system). This operational material — file for print in admin.
- [ ] **GBP-008.** No any API calls to Google: platform only **holds links** and **works in own flow**; GBP profile changes (hours, photos, posts) — manual founder process in Google. Platform doesn't depend on Google availability.

## Admin

- [ ] **GBP-ADM-01.** In location form (§1.2): fields "GBP profile" and "GBP reviews" (URL, validation that it's Google domain); without fill — push without GBP button (LST semantics: soft degradation).
- [ ] **GBP-ADM-02.** Booking link UTM parameters — default `utm_source=google&utm_medium=gbp&utm_campaign={location}`; editable.
- [ ] **GBP-ADM-03.** Print QR: location choice → PNG/SVG `GbpReviewUrl` with brand frame; download.
- [ ] **GBP-ADM-04.** Transition statistics (ANL extension): clicks from GBP → flow → completed visits by locations; GBP channel conversion vs organic.

## Open questions

1. **Second button in push** (GBP-003): two buttons make push denser — check readability on small screens; alternative — channel choice screen after "Leave review" click (extra step, not recommended).
2. **Google review responses**: manual founder process; whether need "new reviews" reminder (impossible without Google API/mail — not now).
3. **GBP posts (promotions, news)**: manual GBP channel; platform doesn't generate posts — consider later as `content` generation (without API — only text prep).
