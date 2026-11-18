# T-2300h · Article View and Booking Click

- **Stage**: M5 (phase 30) · **Tags**: frontend, analytics, content · **Complexity**: junior · **Depends on**: T-2300b, T-4595
- **StoryPoints**: 3

## What

Emit two events that products.md already requires from the blog and which T-4596 registered in advance.

- Opening /blog/{slug} pushes exactly one article_view with article_slug and, if present, article_tag (first tag). Parameter article_category is none: blog categories are none.
- Clicking "Book" on an article pushes one cta_booking_click with cta_location=article.
- No body parameters, full title, preview token, or anything identifying a person. Session identifiers are the same as in remaining T-4595 events; this slice does not invent them.
- Drafts, 404s, and preview tokens do not send the event.
- Same push as other site events. No separate pixel per article.

Mobile screen (T-2300f) sends the same names when the analytics client is already present in the app. If the client is not yet present, web fulfills the products.md requirement; mobile push does not block this slice nor spawn a second contract.

## Why

Without article_view it is invisible which essays drive people, and the booking button at the end of the article is indistinguishable from the hero button. T-4596 intentionally left the event "for later", assuming the blog was none. The page already exists.

## Sources

- products.md §1 (article view, booking click)
- T-4596 (event registry; category parameter replaced with tag by this slice)
- T-4595 (push format), T-4588 (no PII)
- T-2300b (button and page)

## Done

- [ ] One article — one article_view per open, with article_slug
- [ ] Booking click from article — one cta_booking_click with cta_location=article
- [ ] 404 and preview do not send article_view
- [ ] Event body contains no article text and no author name
- [ ] Page test catches exactly one push

## Risks

- [ ] **Analytics integration**: events missing if GTM/GA4 is not loaded
