# Подарункові сертифікати (`gift-certificates`)

> Тип піддомену: **Supporting**

Передплачені сертифікати на послуги: випуск, код, баланс, строк дії, погашення. Сертифікат — **платіжний інструмент, не ціна і не знижка** (ADR 0013): послуга коштує `AgreedPrice` (ADR 0006) як завжди, сертифікат лише оплачує `FinalPrice`. Фіскалізація: чек на продаж, окремий чек на погашення (сертифікат = форма оплати).

Критерії: `docs/acceptance-criteria/16-gift-certificates.md`.

## Ubiquitous language

- **GiftCertificate** — сертифікат: номінал, код, баланс, строк дії, статус.
- **Denomination** — номінал з адмін-набору (за замовчуванням 500 / 1000 / 2000 грн).
- **CertificateCode** — унікальний код; пред'являється на місці при погашенні.
- **CertificateBalance** — залишок: номінал мінус списання; часткове погашення зберігає залишок.
- **Redemption** — списання з балансу на оплату візиту (повне або часткове); форма оплати в `billing`.

## Aggregates (план, ще не код)

- `GiftCertificate` (статуси `active → partially_used → used / expired / cancelled`, історія списань)

## Domain events (план)

- `GiftCertificateSold` → `analytics` (продажі, зобов'язання)
- `CertificateRedeemed` (сума, візит) → `analytics`
- `GiftCertificateExpired` (періодична перевірка строку) → `analytics` (breakage)
- `GiftCertificateCancelled` (адмін, з причиною)

## Порти (план)

- `GiftCertificateRepository`
- `CertificateCodeGenerator` (унікальність, читабельність)

## Хто викликає

- `billing` (погашення на місці): команда списання з балансу — частина оплати `FinalPrice`
- Web (публіка): купівля (`/gift`), кабінет («Мої сертифікати»)
- Mobile (барбер): позначка «оплачено сертифікатом» у візиті
- Admin: ручний випуск на місці, список, налаштування, скасування, статистика

## Шарність

- `domain/` — Чиста модель. Без Nest, Prisma, HTTP, Expo. Тут entities, value objects, events, repository-порти.
- `application/` — Use cases: command/query, handlers, політики доступу. Транзакція = один use case.
- `infrastructure/` — Адаптери цього контексту (Prisma, HTTP, черга). Зовнішні системи лише через ACL, не в domain.

Код домену не імпортує Nest, Prisma, React Native і HTTP-клієнти. Залежності спрямовані всередину: infrastructure → application → domain.

Публічний API контексту (коли з'явиться код) реекспортує domain + application, **не** infrastructure.