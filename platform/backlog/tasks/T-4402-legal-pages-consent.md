# T-4402 · Legal Pages and Consent (Terms, Privacy, Cookies, Consent)

- **Stage**: M3 (v1 launch gate) · **Tags**: frontend, legal · **Complexity**: junior · **Depends on**: T-030, T-032
- **StoryPoints**: 3

## What

Public legal pages and consent touchpoints — mandatory for launching a public site with user registration:

- /terms (public offer), /privacy (personal data processing under the Law of Ukraine "On Personal Data Protection" + GDPR texts), /cookies (cookies policy).
- Footer on all public pages and cabinet: links to all three + FOP/LLC business details.
- Cookie banner / consent for analytics (GA4/Meta — T-4403): consent before loading trackers, rejection = trackers do not load; choice is persisted.
- Consent checkboxes where required: OTP registration (consent to phone processing), public review (publication of name/text — PUB-001), gallery (PRT-001) — record consent fact (who, when, text version).
- Entry disclaimer (web-cabinet-screens §1) — remnant of T-300 "entry disclaimers".

## Why

A public site with registration without offer and privacy policy is a legal risk and grounds for rejection in GBP/App Store. Consent for trackers is a GDPR/ePrivacy requirement for analytics (T-4403).

## Sources

- business/legal-ua/personal-data.md (from T-300); web-cabinet-screens.md §1 (disclaimer)
- PUB-001, PRT-001 (consents), roadmap v1 checklist (GBP — phase 24 requires public details)
- T-3601 (full GDPR contour — this task provides the public minimum before launch)

## Done

- [ ] /terms, /privacy, /cookies published and accessible from footer everywhere
- [ ] Cookie banner: analytics does not load until consent; rejection works
- [ ] Consent fact is recorded (user, date, text version) for registration/review/gallery
- [ ] Business entity details on the offer page

## Risks

- [ ] **Texts are not from lawyers**: finalize with lawyer before launch — task closes publication, not text editing

### Re-verified at 78dab8f8 (2026-11-26)

`business/legal-ua/` does not exist in the repository, so the texts this row publishes have no source.
Unblock: the owner supplies privacy/offer texts; the code side is a page that renders them.

## Re-verified at 91202f68

No legal source text in the repo at `91202f68`: `business/` has no `legal-ua/` directory, and
`docs/` carries no approved Terms/Privacy/Cookies copy. The code side (routes, footer, consent
banner) is implementable, but the three documents and the consent wording are a lawyer/founder
decision, so the row must not invent them. Unblocks with approved texts dropped into the repo.
