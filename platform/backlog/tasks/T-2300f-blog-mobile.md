# T-2300f · Blog in mobile app

- **Stage**: M5 (phase 30) · **Tags**: frontend, content · **Complexity**: middle · **Depends on**: T-2300a, T-070
- **StoryPoints**: 5

## What

Feed screen and article screen in the client shell. Same published `Article`, same public API. Login not required. No editor in the app.

T-070 closed tabs, OTP, and push. No blog in Done. `client-screens.md` §6 still calls feed and article the next screen. No separate mobile article storage in the tree — it should stay that way.

To do:

- Entry from feed (separate tab not mandatory: block on client home and list route). Card: title, excerpt, date, cover with alt.
- Article screen renders `blocks` from API with native components, not site WebView and not a second markdown parser.
- "Open on site" link leads to canonical `https://fade.com.ua/blog/{slug}`. Only this URL can be shared, not app scheme.
- Draft and foreign slug — "no article" state, not empty screen and not draft.
- Empty feed and network error — separate states, with retry for error.
- Booking from article leads to existing mobile booking flow, without a new step.

## Why

Site and app promise the same articles (`products.md` §3). Currently only the site fulfills this promise. WebView would duplicate cache, break canonical URL, and bypass blocks that Slice a specifically provides for this.

## Sources

- `products.md` §3; `docs/client-screens.md` §6
- ADR 0004 (single app), ADR 0026 (single source)
- T-070 (shell, done), T-2300a (blocks), T-071 (booking flow where button leads)

## Done

- [ ] Guest without session opens feed and article
- [ ] Screen has the same blocks as the site for the same article (API snapshot in test)
- [ ] Draft does not open
- [ ] "Open on site" builds canonical HTTPS-URL, not deep link
- [ ] Empty feed and network error differ
- [ ] No second table and no second CMS client

## Risks

- [ ] **Custom parser in app.** Prohibited: render `blocks` only. Otherwise markdown subset will diverge from site
- [ ] **Dark theme.** Use shell tokens (T-4515, if already on screen), do not color article with separate palette
- [ ] **Barber.** Same reader screen available in barber shell if item is already in navigation; do not create separate "barber blog"

## Demarcation

- Site layout — **T-2300b**
- Publishing and preview — admin, **T-2300d**
- Translation — **T-2300g**: app shows language already returned by API, and does not hold its own article dictionary
