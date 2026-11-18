# T-4721 · Preferences the barber reads, on both profiles

- **Stage**: M1 (phase 3) · **Tags**: frontend, ux · **Complexity**: middle · **Depends on**: T-032, T-060
- **StoryPoints**: 12

## What

The site stores preferences as up to 20 lines, each up to 100 characters, through `PATCH /identity/profile/preferences`. The textarea splits on newlines. The limits surface as English API errors («Preference is too long», «Too many preferences»). The app profile has no preferences field.

Both profiles edit that same list. The hint «Цей текст побачить ваш майстер перед візитом» is on both. Over the limit, the screen says «Не більше 20 рядків, до 100 символів у рядку» and does not send the request. A line that is only spaces is dropped, as the site already trims. The field stays one note. It does not become tags or checkboxes.

## Why

The barber's card is fed by this text. The app never writes it, and the site explains the limit only after the request fails in English.

## Sources

- `apps/web/src/app/account/AccountPreferencesCard.tsx`
- `apps/web/src/app/api/account/preferences/route.ts`
- `docs/client-screens.md` §5
- `docs/web-cabinet-screens.md` §2

## Done

- [ ] Slices a, b, and c are `done`
- [ ] A note saved on one surface is the note on the other
- [ ] The 21st line and a 101st character are refused in Ukrainian before the request

## Risks

- [ ] **A richer preference model.** Allergies and «quiet» stay inside the free text. This task does not split them into fields
- [ ] **A second note the client cannot see.** The preview of what the barber reads is T-4731

## Out of scope

- Admin notes on the client card (T-060). Those are the shop's notes, not this text
- The barber's visit screen. It already has a place for this text
