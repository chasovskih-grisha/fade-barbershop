# T-4431 · Viber/Telegram Notification Channels

- **Stage**: M2 (phase 5) · **Tags**: backend, notifications, integration · **Complexity**: middle · **Depends on**: T-080, T-4400
- **StoryPoints**: 5

## What

Secondary delivery channels on top of `Notification` (T-080): Viber Bot / Telegram Bot linked by phone number (no authorization — linking token), channel fallback queue SMS → Viber → Telegram based on client preference, separate consent (T-4217 pumps communication preferences). Dev mode — delivery via dev container.

## Why

SMS does not always reach (foreign clients, removed phone), Viber is the most common messenger in CLT; increasing successful delivery of confirmation/reminders is critical (T-080).

## Sources

- notifications README; T-080; T-4217 (consents/quiet hours); T-4400 (lack of channel consent)

## Done

- [ ] Viber/Telegram channels linked to phone by token; preference is set
- [ ] Queue falls back to the next channel on failure
- [ ] Consents and quiet hours are respected (test)

## Risks

- [ ] **Global phone**: Viber not available outside the region — "preference" binding + provider error → SMS fallback
