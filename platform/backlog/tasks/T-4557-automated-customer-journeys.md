# T-4557 · Automated customer journeys: triggers, conditions, delays, actions, canvas

- **Stage**: M4 (phase 16-18) · **Tags**: backend, marketing, automation · **Complexity**: senior · **Depends on**: T-4545, T-4555, T-4556, T-3101, T-4100
- **StoryPoints**: 21

## What

Двигун автоматизованих клієнтських подорожей (customer journeys) — уніфікація T-3101 (campaigns) і T-4100 (journeys):
- **Triggers**: події домену (`ClientRegistered`, `AppointmentBooked`, `AppointmentCompleted`, `AppointmentNoShowed`, `AppointmentCancelled`, `MembershipPurchased`, `MembershipExpiring`, `GiftCardPurchased`, `LoyaltyTierChanged`, `BirthdayApproaching`, `ClientInactive` (X днів), `WaitlistSlotAvailable`)
- **Conditions**: JSON Logic (T-4556) над контекстом клієнта/події (сегмент, tags, історія, канал залучення)
- **Delays**: фіксовані (wait 24h), относительные (wait until 2h before appointment), cron-like (щодня о 10:00)
- **Actions**: SendNotification (T-4555), ApplyPromotion (T-4553), AwardLoyalty (T-4551), CreateTask (для адміна/барбера), UpdateClientTags, WebhookCall
- **Canvas/Builder**: візуальний редактор шляхів (nodes + edges), версіонування, A/B testing (розділення трафіку %), preview симуляції
- **Journey versions**: чернетка → активна → пауза → архів. Зміна версії не впливає на вже запущені instance
- **Instance tracking**: кожен запуск = `JourneyInstance` (clientId, journeyId, version, currentNode, status: RUNNING/COMPLETED/FAILED/STOPPED, startedAt, completedAt)
- **Analytics**: конверсія по нодах, drop-off points, revenue attribution, A/B results

## Why

Маркетингова автоматизація: win-back, onboarding, birthday, no-show follow-up, membership renewal — без коду.

## Sources

- T-3101 (win-back campaigns), T-4100 (journeys), T-4545 (segmentation), T-4555 (communications), T-4556 (rules)
- Canvas decision: "Choose one orchestration owner; treat the other as adapter"
- Altegio: automatyzacja marketingowa, scenariusze, triggery, warunki, opóźnienia, akcje, A/B testy

## Done

- [ ] Domain: `JourneyDefinition` (nodes[], edges[], version, status), `JourneyInstance` (clientId, currentNode, context, status)
- [ ] Engine: event-driven (Kafka/Redis streams) — trigger → evaluate conditions → schedule actions (delayed jobs)
- [ ] Action executors: для кожного типу дії (notification, promotion, loyalty, task, webhook)
- [ ] Visual builder: React Flow / Cytosave canvas, drag&drop nodes, property panel, validation (no cycles, required fields)
- [ ] Versioning: immutable definitions, migration instances при деплої нової версії (опціонально)
- [ ] A/B testing: split node з вагою, статистика по варіантах
- [ ] Admin UI: список journey, builder, analytics dashboard, instance explorer
- [ ] Integration: win-back (T-3101) → переноситься в journey "Win-back", birthday → journey "Birthday"

## Risks

- [ ] **Infinite loops**: цикли в графі — валідація при збереженні (DAG only)
- [ ] **Scale**: тисячі істанцій — шардинг по clientId, TTL для completed instances
- [ ] **Delivery guarantees**: at-least-once для actions — идемпотентність в executors