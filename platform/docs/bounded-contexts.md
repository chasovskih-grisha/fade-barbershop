# Bounded contexts

Межі проведені по **зміні мови**, не по екранах. Екран календаря в mobile читає `scheduling`; картка гостя поруч — `crm`.

## Піддомени

| Піддомен | Тип | Інвестиції |
|----------|-----|------------|
| Scheduling | Core | Свої правила слотів, 2 крісла, барбер, мережа |
| CRM | Core | Відношення, не «ще одна таблиця users» |
| Messaging | Core | Чат навколо візиту — відмінність від типового віджета запису |
| Locations / Catalog | Supporting | Потрібні, не унікальні |
| Haircut-ai | Supporting | Генерація AI-пропозицій зачісок за фото клієнта; зовнішній AI-провайдер за ACL |
| Content | Supporting | Блог на сайті і в додатку; SEO на web |
| Loyalty | Supporting | Бонус «кожен 7-й візит»; лічильник на подіях scheduling |
| Feedback | Supporting | Відгуки клієнтів про завершені візити (оцінка, текст, фото) |
| Discounts | Supporting | Промокоди, правила і VIP-знижки; застосування фіксується на візиті |
| Analytics | Supporting (read-model) | KPI-проєкції на подіях інших контекстів; не джерело правди; жорстка вимога v1 |
| Portfolio | Supporting | Публічна галерея робіт «до/після» за згодою клієнта і модерацією адміна |
| Gift-certificates | Supporting | Передплачені сертифікати: випуск, баланс, погашення; платіжний інструмент, не ціна (ADR 0013) |
| Assistants | Supporting | LLM-шар: агент = інструменти-порти на готові use cases інших контекстів; своєї доменної логіки не вводить (ADR 0020) |
| Identity, Billing, Notifications | Generic | Купити/адаптувати, не винаходити |

## Контекстна карта

```
identity ──OHS──▶ усі контексти (UserId, Role)
locations ──CS──▶ scheduling, catalog, crm
catalog ──CS──▶ scheduling, web
scheduling ──events──▶ crm, messaging, notifications, billing, loyalty, feedback, analytics
loyalty ──CS──▶ scheduling (FreeVisit при записі), billing (FinalPrice = 0)
crm ──CS──▶ messaging, admin, mobile barber
messaging ──events──▶ notifications
content ──OHS──▶ web, mobile, admin
haircut-ai ──CS──▶ scheduling (HaircutReferenceId), crm (історія клієнта)
haircut-ai ──ACL──▶ зовнішній AI-провайдер генерації
discounts ──CS──▶ scheduling (AppliedDiscounts), crm (VIP-рівень), billing (FinalPrice)
billing ──ACL──▶ Checkbox, еквайринг
billing ──events──▶ scheduling, notifications, analytics
analytics ──OHS──▶ admin (дашборд KPI)
scheduling ──OHS──▶ web-гість (публічна проекція доступності, read-only, не бронює — LST-001)
portfolio ◀──events── scheduling (AppointmentCompleted → запит згоди)
portfolio ──OHS──▶ content (галерея на сторінці барбера), admin (модерація)
gift-certificates ──CS──▶ billing (продаж → платіж + чек #1; погашення → чек #2, сертифікат = форма оплати)
gift-certificates ──events──▶ analytics (зобов'язання, breakage)
notifications ──conformist──▶ Expo / SMS-провайдер
assistants ◀──CHANNEL── messaging (вхід діалогу), notifications (періодичні звіти)
assistants ──PORTS──▶ scheduling, crm, catalog, analytics, loyalty, discounts, feedback (інструменти = готові use cases; read-only там, де read-only)
assistants ──ACL──▶ зовнішній LLM-провайдер (LlmClient, окремий порт від haircut-ai)
```

- **OHS** — Open Host Service (стабільний контракт).
- **CS** — Customer–Supplier (downstream чекає модель upstream).
- **ACL** — переклад зовнішньої моделі в нашу.
- **Conformist** — беремо модель провайдера як є (push payload).

Зовнішні провайдери (ПРРО, еквайринг, SMS OTP) → **ACL**. Агрегати не називаються іменами провайдерів (`CheckboxReceipt` як внутрішній тип — ні; `FiscalReceipt` — так).

## Інваріанти між контекстами

1. `Appointment` / `AppointmentParty` посилаються на `ClientProfileId`, `BarberUserId`, `LocationId`, `ServiceId` — лише ID. Ноги партії мають свої `BarberId` і `ChairId`.
2. Чат не створює запис. Запис може відкрити розмову.
3. Публікація статті не чіпає календар. Один `Article` читають сайт і додаток; канонічний URL — лише web.
4. Оплата не «є» візитом: візит може бути завершений, чек — окремий агрегат.
5. `User` може існувати без `ClientProfile` (барбер, admin). Клієнтський профіль створюється політикою на `UserRegistered` з роллю `client` (перший успішний OTP).
6. Один `PhoneNumber` → один `User`. Вхід з сайту і з додатка не створює другого акаунта.
7. `Appointment` посилається на `HaircutReference` лише ID; фото не копіюються в `scheduling`.
8. `HaircutSuggestion` не показується барберу, доки клієнт не вибрав варіант і не прикріпив його до візиту.
9. Лічильник лояльності рахує лише завершені візити (`AppointmentCompleted`); скасовані і no-show не зараховуються.
10. Один відгук на один завершений візит; відгук може залишити лише клієнт цього візиту.
11. `Appointment` несе `AgreedPrice` — зміна ціни в `catalog` не змінює існуючі візити (ADR 0006). Для `father-son` снепшот живе на `AppointmentParty` (ADR 0011).
12. `FinalPrice` = `AgreedPrice` − Σ `AppliedDiscounts` ≥ 0; знижки фіксуються при записі і не змінюються після (ADR 0007). Безкоштовний візит лояльності — пріоритет: `FinalPrice = 0`.
13. `AppointmentParty` бронюється однією транзакцією з двома `PartyLeg`; однієї ноги не існує. Parallel вимагає двох барберів і двох крісел.
14. Лояльність інкрементується лише по нозі батька (`ClientProfile` записника); нога сина без профілю в v1 не рахується.
15. Елемент `portfolio` публікується лише після згоди клієнта **і** модерації адміна; відкликання згоди ховає елемент миттєво. Фото не копіюються — лише посилання на джерело (інваріант 7).
16. Активна заявка waitlist утримує слот `SlotHold`-ом (15 хв); hold не конвертується автоматично — `Appointment` створює лише явне підтвердження клієнта (ADR 0012).
17. Сертифікат не змінює `AgreedPrice`/`FinalPrice` (ADR 0013): він — форма оплати в `billing`; списання балансу відбувається в `gift-certificates`. Безкоштовний 7-й візит (LYL-007) не списує сертифікат.
18. Атрибуція реферала (`ReferredBy`) належить `crm` і імутабельна після реєстрації; винагорода запрошувачу нараховується лише на `AppointmentCompleted` друга (ADR 0014), ніколи — на реєстрацію або запис.
19. `assistants` не має власних Appointment/ClientProfile тощо — лише ID і порти на use cases; агент не розширює роль користувача і не виконує критичні дії без підтвердження (ADR 0020, ASSIST-001/006).

## Дані

Одна Postgres-база, **схеми по контекстах** (`identity`, `scheduling`, …). Не shared tables «на всіх». Prisma-схеми не течуть у domain.

Окрема БД на контекст — лише якщо колись винесемо сервіс.

## Деталі по папках

Кожен контекст описаний у `apps/api/src/{name}/README.md`.
