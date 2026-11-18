# 21. Public reviews on site (consent + moderation)

> Feature: activation of deferred FDB-006 decision — publication of reviews on site as **social proof**. Three publication conditions together: **client consent** (checkbox at submission, FDB-WEB-05) + **admin moderation** (default-deny) + **feature enabled**. Badge from Google/GBP: each public review — **confirmed completed visit**, not anonymous opinion.
>
> Contexts: **without new context**. `feedback` — publication status on `Feedback` and `FeedbackPublished`/`FeedbackUnpublished` events (already in plan); `content` OHS — render on site; `scheduling` — completed visit fact for "Visit Verified" badge. Phase 12 extension; when to enable — recommendation in "Open questions".

## Rule (common)

- [ ] **PUB-001.** Publication = **three conditions together**: (1) client consent at submission (FDB-WEB-05 checkbox, covers review text and photo); (2) admin approval (**default-deny** — nothing appears on site without moderator explicit action); (3) feature enabled (global switch, PUB-ADM-03). **Selected** reviews published, not all.
- [ ] **PUB-002.** Publication lifecycle: `private` (no consent or not reviewed) → `pending_review` (consent exists, waiting admin) → `published` / `rejected` (with reason). Client editing of **published** review removes it from site and returns to `pending_review` — edited text never auto-appears on site.
- [ ] **PUB-003.** Client consent withdrawal (in "My reviews") → **immediate** site removal; review itself remains private. Review deletion (FDB-WEB-04) — also immediate removal.
- [ ] **PUB-004.** **"Visit Verified" badge** on each public review: only completed visit review published (FDB-001 already requires) — this constructive mark vs anonymous reviews and SEO advantage over GBP.
- [ ] **PUB-005.** Public review composition: stars, text, **name + surname first letter** (privacy), visit date, service, barber; photo — if exists and consent covers (PUB-001). No phones, no full names.
- [ ] **PUB-006.** Aggregates shown only from **N published** (default 5, configurable): barber/location average rating not displayed while published less than threshold — protection from "3★ from one review" distortion. Threshold and switch — PUB-ADM-03.
- [ ] **PUB-007.** Public **response** to published review — on behalf of founder (admin writes, PUB-ADM-02); barber's own response later (open question). Response visible under review.
- [ ] **PUB-008.** Moderation/removal hides published review **immediately** (FDB-ADM-02 fully activated); `FeedbackPublished` / `FeedbackUnpublished` events — source for `content` (site re-reads published) and `analytics`.

## Web (public site)

- [ ] **PUB-WEB-01.** `/reviews` page: filters (location, barber, rating), aggregate at top (average + count, if ≥ threshold), strip of published with "Visit Verified" badge and responses.
- [ ] **PUB-WEB-02.** `/barbers/{slug}`: barber rating block (average + count, if ≥ threshold) + their published reviews — replaces deferred note "rating after public feature" (FDB-006 limitation removed by this feature).
- [ ] **PUB-WEB-03.** `/locations/{code}`: location aggregate + recent published reviews of this location.
- [ ] **PUB-WEB-04.** SEO: schema.org `Review` / `AggregateRating` markup on barber and location pages (rich results in search — synergy with GBP channel, phase 24; doesn't duplicate GBP — own verified reviews).
- [ ] **PUB-WEB-05.** Cabinet → "My reviews": each status (private / in moderation / published), "Remove from publication" button (PUB-003) and "Delete".

## Admin

- [ ] **PUB-ADM-01.** Moderation queue: reviews with consent; visible consent (when, what covers), visit (link to card), barber, text/photo. Actions: Publish / Reject (with reason to client) / Remove (for published).
- [ ] **PUB-ADM-02.** Founder response to published review: composer under review, log; response published together with review.
- [ ] **PUB-ADM-03.** Settings: public reviews global switch, N threshold for aggregates, name rule (name + initials / other option).
- [ ] **PUB-ADM-04.** Activates FDB-ADM-04 (was "only with this feature") — now full specification.

## Open questions

1. **When to enable** (recommendation): after first 30–50 private reviews **or** with second location (phase 9) — whichever first. Before that social proof carried by GBP and gallery (phases 24, 19).
2. **Photo consent**: one checkbox covers text + photo (recommended — simpler) or separate photo consent.
3. **Name rule**: name + surname first letter (recommended) vs full name vs nickname by client choice.
4. **Barber public response** (instead/alongside founder response, PUB-007): after first publication experience.
