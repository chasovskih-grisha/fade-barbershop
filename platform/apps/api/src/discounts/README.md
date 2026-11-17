# Знижки (`discounts`)

> Тип піддомену: **Supporting**

Визначення знижок трьох типів: **промокоди** (клієнт вводить код), **автоматичні правила** (перший візит, непікові години, дні тижня), **VIP-рівень** клієнта (на картці в `crm`). Застосування обчислюється при записі і фіксується на `Appointment` у `scheduling` як `AppliedDiscounts`; оплата — `FinalPrice` (ADR 0007).

Приймальні критерії: `docs/acceptance-criteria/07-discounts.md`.

**Кампанійні коди** (`WNB-003`, фаза 18): win-back-кампанії створюють звичайні `PromoCode` з обмеженням «1 використання на клієнта сегмента» і видимістю «лише для клієнтів сегмента» — окремої моделі знижок не вводиться.

## Ubiquitous language

- **PromoCode** — код знижки, який вводить клієнт (нечутливий до регістру, з лімітом використань і терміном дії).
- **ReferralDiscount** — referral-тип знижки: автоматична знижка рефералу на перший візит і винагорода запрошувачу після завершення візиту друга; застосування і кап — спільні правила DSC-003 (ADR 0014).
- **DiscountRule** — автоматичне правило (перший візит, непікові години, день тижня).
- **ClientDiscountLevel** — постійна знижка на картці клієнта (VIP), задається адміном.
- **AppliedDiscount** — застосована знижка на візиті: `{ тип, джерело (ID), сума (UAH) }` — снепшот.
- **FinalPrice** — підсумкова сума візиту: `AgreedPrice` − Σ `AppliedDiscounts`, ≥ 0.

## Aggregates (план, ще не код)

- `PromoCode`
- `DiscountRule`
- `ClientDiscountLevel` (посилання на `ClientProfileId` з `crm`)

## Domain events (план)

- `PromoCodeCreated` / `PromoCodeDeactivated`
- `DiscountRuleChanged`
- `DiscountApplied` (при записі; read-model для статистики)

## Порти (план)

- `PromoCodeRepository`
- `DiscountRuleRepository`
- `ClientDiscountLevelRepository`
- `DiscountCalculator` (сервіс: клієнт + слот + послуга + промокод → застосовні знижки)

## Хто викликає

- `scheduling` (book): обчислення і фіксація `AppliedDiscounts` на візиті
- Web / mobile (клієнт): поле «Промокод», розбивка «базова ціна − знижка = підсумок»
- Admin: промокоди, правила, VIP-рівні, статистика

## Шарність

- `domain/` — Чиста модель. Без Nest, Prisma, HTTP, Expo. Тут entities, value objects, events, repository-порти.
- `application/` — Use cases: command/query, handlers, політики доступу. Транзакція = один use case.
- `infrastructure/` — Адаптери цього контексту (Prisma, HTTP, черга).

Код домену не імпортує Nest, Prisma, React Native і HTTP-клієнти. Залежності спрямовані всередину: infrastructure → application → domain.

Публічний API контексту (коли з'явиться код) реекспортує domain + application, **не** infrastructure.