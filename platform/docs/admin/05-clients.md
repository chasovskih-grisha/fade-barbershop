# Admin Panel — Clients CRM Domain

## Purpose
Customer relationship management. Handles client profiles, visit history, preferences, loyalty progress, referral codes, and feedback/reviews. All client data is tied to the `User` entity with role `client` (ADR 0005), authenticated via phone+OTP.

## Pages & Features

- **Client List** (`/clients` — part of admin sidebar)
  - **Layout**: Header + search (name / phone) → Location filter (All / CLT-01 / …) → Loyalty status filter (All / Active / Inactive) → Table
  - **Columns**: Name, Phone, Visits count, Last visit, Loyalty progress (`3/7`), VIP badge, Actions (Open card)
  - **Empty state**: "No clients yet."
  - **Deactivated clients**: Do not exist (client role is never deactivated)

- **Client Card** (MNG-ADM-16)
  - **Profile**: Name, Phone, Contacts; **VIP discount level** — field with change log (DSC-ADM-03, DSC-VIP-01)
  - **Preferences**: List `Preference` (length, product, coffee) — show and edit (CRM)
  - **Visit History**: Table — date, Location, Barber, Service, Price (`AgreedPrice`/`FinalPrice`), Status (MNG-ADM-16)
  - **Notes**: Service notes (visible to barber in their card, **not to client**) — list + "Add note" (textarea, date/author) (MNG-ADM-16)
  - **Loyalty**: Progress "X/7" + "Correct" button → modal with reason; correction logged (LYL-ADM-02/03)
  - **Client Reviews**: List with filter (all / mine) — data from `feedback` (FDB-ADM-01)
  - **Referral**: Personal code, list of invited, rewards (RFR-ADM-02-semantics at client level)
  - **Actions**: "Book appointment" (creation path to booking-flow), "Add to waitlist" (waitlist with pre-selected client — WTL-ADM-02, phase 17), "Write" (chat, phase 7)
  - **Пошук і фільтри**: опис у `backlog/tasks/T-4606a-client-list-table.md` — пошук за ім'ям/телефоном, фільтр локації, фільтр статусу лояльності, закритий набір сортування, пагінація island-патерну.
  - **Підсумки**: стрічка KPI-карток над таблицею по відфільтрованій множині (T-4606b): всього / нові за період / візити / сума / середній чек / no-show / «тихі» 90+ / повторні / розподіл за лояльністю і локацією останнього візиту; період `7d|30d|90d` змінює лише вікно підсумків, не таблицю.
  - **Стани**: Skeleton; «Клієнтів ще немає» (база порожня); «За фільтрами нічого не знайдено» + «Скинути фільтри»; помилка завантаження — AlertBanner + «Спробувати ще раз» (не ламає фільтри в URL).

## API Endpoints
CRM-ендпоїнти адмінки під `AdminSessionGuard`. Список — `GET /admin/clients`, картка — `GET/PATCH` під `admin/clients/:id`. Див. також `docs/acceptance-criteria/04-admin-management.md` (MNG-ADM-16).

- `GET /admin/clients` — Список клієнтів. Query-параметри: `search` (ім'я або телефон; телефон нормалізується до E.164), `locationId` (локація останнього візиту), `loyaltyStatus` (`active`/`inactive`), `sort` (закритий набір `name|phone|visits|lastVisit|loyalty|vip` — колонки §6.1), `order` (`asc`/`desc`), `page` (≥ 1), `perPage` (1..100, дефолт 20), `period` (`7d|30d|90d` — вікно підсумків, дефолт `30d`). Відповідь `ClientListResult`: `{ items, total, page, pages, summary }`. Валідація — чиста функція `parseClientListQuery` (`crm/application/admin-client-list.query.ts`), некоректні значення → 400 через `CrmExceptionFilter`. Read-модель — `AdminClientList` (`crm/application/admin-client-list.ts`), порт — `ClientListReader` (`crm/application/client-list-reader.ts`).
  - **`summary` (T-4606b)** — підсумки **тієї ж фільтрованої множини**, що й таблиця: `summary.total === total` (тест на API і e2e), період змінює лише вікно. Поля: `period`, `from`/`to` (ISO-межі вікна), `newClients`, `visits`, `revenue`, `avgTicket` (AvgTicket — `docs/ubiquitous-language.md`), `noShowRate` (NoShowRate), `quietClients`/`quietShare` (без візиту 90+ днів, поріг як у NSH-ADM-01), `repeatShare`, `loyalty` (none/progress/freeVisit/cycle), `locations` (`byLocation` + `noVisit`). Рішення «перерахунок із проєкцій, а не подієва агрегація» і спільність із T-4528b — у `apps/api/src/crm/README.md`.
  - Фейк для e2e — `MemClientList` (`crm/e2e/admin-clients.list-fakes.ts`), спеки — `src/crm/e2e/admin-clients.e2e.spec.ts` (список) і `src/crm/e2e/admin-clients.summary.e2e.spec.ts` (підсумки).
  - Юніт-спеки — `src/crm/application/admin-client-list.spec.ts` (валідація запиту, нормалізація телефону), `admin-client-list.sorting.spec.ts` (сортування/пагінація), `admin-client-list.summary.spec.ts` + `client-list-summary.spec.ts` / `client-list-summary.distributions.spec.ts` (підсумки).
- `GET /admin/clients/by-user/:userId` — картка клієнта по `User.id` (для телефонного запису з передобраним клієнтом).
- `GET /admin/clients/byphone/:phone` — картка по телефону.
- `GET /admin/clients/:clientId` — картка клієнта (id профілю).
- `PATCH /admin/clients/:clientId` — ім'я / телефон.
- `PATCH /admin/clients/:clientId/preferences`.
- `PATCH /admin/clients/:clientId/vip-discount`.
- `PATCH /admin/clients/:clientId/loyalty-visits`.
- Нотатки — окремі ендпоїнти, контролер окремого файлу (ЛОК-гейт).

## Дефолтні DTO

- `ClientListItem`: `{ id, userId, name, phone, visits, lastVisit, loyaltyVisits, vipDiscountPercent }` (дзеркало API `crm/application/admin-client-list.view.ts`).
- Картка клієнта (DTO) — плоска структура без `props`: id, phone, name, contacts, preferences (масив), VIP discount, loyalty state (`X/7`), referral code, notes (масив), reviews (масив).
- Preference item: type (length / product / coffee), value.
- Review item: id, rating, text, photo (опціонально), author, createdAt, isPublic.

> Виправлено T-4606: раніше тут був «inferred»-блок `GET /crm/clients` — за конвенцією адмінської поверхні (§Authorization у `docs/admin/16-shared.md`) CRM-маршрути живуть під префіксом `/admin/clients`; перелік вище перевірено кодом `crm/infrastructure/admin-clients.controller.ts`. Дубльований блок «DTOs (inferred)» прибрано — він повторював «Дефолтні DTO» вище.

## Бізнес-правила

- Клієнт не має пароля — вхід тільки за телефоном + OTP (ADR 0005).
- Один `User` на номер — у веб, мобільному і адмінці.
- Знижка VIP — тільки з промокодом, сумарний ліміт 30% (DSC-003).
- Нотатки — тільки для барбера в його картці клієнта, не для клієнта.
- Лояльність: лічильник збільшується ідемпотентно при `AppointmentCompleted` по `AppointmentId` (LYL-ADM-01).
- Безкоштовний візит: на 6/7 візитів → `FreeVisitGranted`, застосовується на наступному записі → `FinalPrice = 0` (LYL-004…007).
- Реферальний код — особистий клієнта; вік атрибуції 30 днів; останній дотик до реєстрації (ADR 0014).
- Деактивованого клієнта не буває — роль `client` не деактивується.

## Дозволи

- Роль `admin` — повний доступ до списку і карток усіх клієнтів.
- `location_manager` (фаза 9+) — клієнти власної локації.
- Прямий доступ без ролі → 403.
- Барбер — тільки візити своїх клієнтів (мобільний §4.3, без пошуку).

## Development Notes

- Пошук по телефону — основний спосіб знайти клієнта (без імені/пароля).
- Вподобання — вільні текстові категорії: «довжина», «продукт», «кава» тощо.
- Нотатки мають автора і час; барбер бачить нотатки всіх клієнтів, яких обслуговував.
- Лояльність зберігається на клієнта; збільшується при кожному завершеному записі.
- Реферальний код генерується при першій реєстрації; зберігається в контексті `crm`, не `identity`.
- Відгуки — з модуля `feedback`; фільтрування «всі/мої» (поточний клієнт).

## Важливі крайні випадки

- Деактивованого клієнта не існує — роль клієнта не деактивується.
- Зміна номера: новий номер → новий `User`, старий стає сиротою (аудит).
- Знижка VIP — тільки з промокодом, сумарний ліміт 30%.
- Нотатки — завжди з автором і датою; барбер бачить нотатки всіх клієнтів.
- Прогрес лояльності: показується як `X/7`, де X — завершені візити з останнього скидання (або за весь час, залежно від конфігу).
- Рефералка — особистий код у картці клієнта, можна поширювати; однократне використання на першому візиті.
- Клієнт без профілю (гостевой запис без OTP) — мовчки падає зі списку (фільтр locationId і loyaltyStatus працюють по відвідувачах).

## Посилання на суміжну документацію

- `docs/acceptance-criteria/04-admin-management.md` (MNG-ADM-16).
- `docs/acceptance-criteria/05-loyalty-free-visit.md` (LYL-ADM-02/03).
- `docs/acceptance-criteria/17-referral-program.md` (RFR-ADM-01…04).
- `docs/acceptance-criteria/07-discounts.md` (DSC-ADM-03, DSC-VIP-01).
- `docs/acceptance-criteria/15-public-reviews.md` (FDB-ADM-01).
- `docs/ubiquitous-language.md` (User, ClientProfile, PhoneNumber, Role, LoyaltyRule, ClientLoyaltyState, FreeVisit, Feedback, Rating, FeedbackPhoto, PromoCode, DiscountRule, ClientDiscountLevel, AppliedDiscount, FinalPrice).
- `products.md` (§5 — CRM, §7 — знижки VIP).
- `docs/roadmap.md` (фази 5 — CRM, 11 — лояльність, 12 — відгуки, 21 — реферали).
- `docs/adr/` (ADR 0005 — один User; ADR 0007 — безкоштовний візит; ADR 0014 — атрибуція рефералів).
- `backlog/tasks/T-4606a-client-list-table.md` — задача списку клієнтів.
- `backlog/tasks/T-4606b-client-list-summary.md` — додавання `summary` до списку.
- `docs/admin-screens.md §6.1` — специфікація екрану.
- `docs/admin/16-shared.md` — шаблони сторінки (пагінація, порожній стан, помилка).
- `apps/admin/src/app/clients/phone-booking-path.ts` — шлях до телефонного запису з передобраним клієнтом.
