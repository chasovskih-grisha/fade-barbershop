# T-4559 · Waitlist: Expiration, Priority, Client Cancellation, Admin Management, Notifications

- **Stage**: M4 (phase 16-19) · **Tags**: backend, scheduling, crm · **Complexity**: middle · **Depends on**: T-170, T-171, T-4453, T-4555, T-4545
- **StoryPoints**: 8

## What

Extension of waitlist (T-170) into a managed queue:
- **Priority scoring**: queue priority = tenure (free/online priority) + wait time + client history (T-4545) + VIP tier (T-152); tie-break — entry time.
- **Offer expiration**: offer retains `holdExpiresAt`; timer triggers, emits `OfferExpired` → next in queue.
- **Client cancellation**: client cancels wait (mobile/cabinet) → slot release, public offer to next.
- **Fuzzy window re-fit**: `SlotWindow` (ADR 0012) — client picks a time range, system matches a slot within the window.
- **Chain / multiple offers**: cascade offers to multiple clients simultaneously (overbooking-lite with priority).
- **Admin management**: queue list, manual promote/demote, reason, inter-location transfer, history.
- **Notifications**: client «you will be invited at 14:00» with confirmation button (T-4555); barber — «queue updated» (T-084).
- **Analytics**: waitlist conversion → booking, time to fill, step drop-off (T-4563).

## Why

A queue without priorities and offer lifecycle turns into «zombie» slots in the schedule; expiration + client cancellation free up slots automatically.

## Sources

- T-170/171 (waitlist core + surfaces), T-4453 (priorities), ADR 0012 (soft-hold + fuzzy window)
- T-4555 (communications), T-4545 (segmentation/priorities)
- Altegio: prioritized queue, automatic offer closure, client notification

## Done

- [ ] Priority scoring: transparent and deterministic, unit tests for edge cases
- [ ] Offer lifecycle: timeout triggers `OfferExpired` and next offer
- [ ] Client cancellation frees slot immediately
- [ ] Admin queue management view and actions

## Risks

- [ ] **Notification delivery failures**: push/SMS fails during offer window — fallback timeout and skip to next client.
