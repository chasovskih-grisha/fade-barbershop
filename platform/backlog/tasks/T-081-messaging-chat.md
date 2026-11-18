# T-081 · Client ↔ barber chat

- **Stage**: M2 (phase 7) · **Tags**: backend, integration · **Complexity**: senior · **Depends on**: T-080
- **StoryPoints**: 8

## What

The `messaging` context (specification queue): chat within the scope of a visit (entry from the visit card §4/§4.3), realtime, offline sending queue, push notifications for new messages, boundaries: a barber can see chats of their visits.

## Sources

- products.md §3 (chat), `client-screens.md` §6 (queue), `barber-screens.md` §6

## Done

- [ ] Chat works on web/mobile within the scope of a visit
- [ ] Offline queue and push work

## Risks

- [ ] **Migrations**: schema changes break existing data — migration with a backfill plan
- [ ] **Domain events**: idempotent subscriptions (ADR 0009/0016 pattern)
