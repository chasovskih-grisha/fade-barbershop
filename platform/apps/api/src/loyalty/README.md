# Лояльність (`loyalty`)

> Тип піддомену: **Supporting**

Бонус «кожен 7-й візит — безкоштовно». Лічильник будується на подіях `scheduling` (`AppointmentCompleted`), безкоштовний візит відображається в `billing` (сума 0) і `notifications` (push). Модель лічильника, скидання і підписка на події — **ADR 0009**. Пакет «Батько + син»: інкремент **лише** по нозі батька, не +2 (ADR 0011, PARTY-010).

Ширші програми лояльності і абонементи — поза scope (див. `docs/roadmap.md`). Приймальні критерії: `docs/acceptance-criteria/05-loyalty-free-visit.md`.

## Ubiquitous language

- **LoyaltyRule** — правило бонусу: поріг (за замовчуванням 7), ввімкнено/вимкнено, скоуп (мережа/локація).
- **ClientLoyaltyState** — стан клієнта: лічильник завершених візитів «X/7» і чи є активний безкоштовний візит.
- **FreeVisit** — право на безкоштовний візит (видається на 6/7, застосовується до наступного візиту).

## Aggregates (план, ще не код)

- `LoyaltyRule`
- `ClientLoyaltyState`

## Domain events (план)

- `FreeVisitGranted` (на 6/7) → `notifications`
- `FreeVisitApplied` (до візиту) → `billing` (сума 0)
- `FreeVisitUsed` (після завершення) → скидання лічильника
- `LoyaltyCounterAdjusted` (ручна корекція адміном)

## Порти (план)

- `LoyaltyRuleRepository`
- `ClientLoyaltyStateRepository`

## Хто викликає

- Вхідні події: `scheduling.AppointmentCompleted`
- Web / mobile (клієнт): прогрес «X/7», позначка «Безкоштовно»
- Mobile (барбер): позначка в картці візиту
- Admin: налаштування правила, корекція лічильників, історія бонусів

## Шарність

- `domain/` — Чиста модель. Без Nest, Prisma, HTTP, Expo. Тут entities, value objects, events, repository-порти.
- `application/` — Use cases: command/query, handlers, політики доступу. Транзакція = один use case.
- `infrastructure/` — Адаптери цього контексту (Prisma, HTTP, черга).

Код домену не імпортує Nest, Prisma, React Native і HTTP-клієнти. Залежності спрямовані всередину: infrastructure → application → domain.

Публічний API контексту (коли з'явиться код) реекспортує domain + application, **не** infrastructure.