# T-4535 · Appointment notes: internal, client-visible, comments

- **Stage**: M1 (phase 4) · **Tags**: backend, frontend, scheduling · **Complexity**: junior · **Depends on**: T-042, T-043
- **StoryPoints**: 3

## What

Three types of notes on a booking:
1. **Internal staff notes** — visible to admin and barber (notes on allergies, preferences, warnings)
2. **Client-visible notes** — visible to client in cabinet/mobile (e.g., "bring example photo")
3. **Comments** — message thread between participants (admin ↔ barber, barber → client via T-081 chat)

CRUD for each type, access rights, display in admin, barber mobile, web cabinet.

## Why

Communication of visit context without duplicating in chat. Internal notes are an operational necessity (dye allergy, likes quiet).

## Sources

- T-043 (haircut reference + comment), T-081 (messaging), admin-screens.md §5.2, barber-screens.md
- Altegio: uwagi wewnętrzne, uwagi klienta, komentarze do wizyty

## Done

- [ ] Schema: `AppointmentNote` (type: INTERNAL | CLIENT_VISIBLE | COMMENT), author, content, createdAt
- [ ] API: Note CRUD, filter by type
- [ ] Admin: notes block on visit card with type separation
- [ ] Barber mobile: internal notes + client-visible in visit card
- [ ] Web cabinet: client-visible notes + comments (read-only)

## Risks

- [ ] **Type confusion**: clear visual segregation in UI (color/icon)
- [ ] **Chats vs comments**: comments are tied to a booking, chat is tied to a client/visit (T-081)
