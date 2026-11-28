# Публічна галерея робіт (`portfolio`)

> Тип піддомену: **Supporting**

Публічна галерея «до/після» і AI-результатів по барберах. Сировина з трьох існуючих потоків: референси/AI-варіанти (`haircut-ai`), фото відгуків (`feedback`), фото з крісла. Публікація тільки за **двошаровою згодою** (клієнт + модерація адміна). Критерії: `docs/acceptance-criteria/15-public-gallery.md`.

## Ubiquitous language

- **PortfolioItem** — елемент галереї: пара «до/після» або одиночне «після»; барбер, послуга, візит (посилання), опційний опис і теги.
- **BeforePhoto / AfterPhoto** — фото елемента; «до» може бути AI-варіантом із референсу або знімком до стрижки.
- **ClientConsent** — згода клієнта на публікацію (так / анонімно без обличчя / ні), з датою і способом отримання (opt-in екран, відмітка барбера в кріслі — не публікація).
- **PublicationStatus** — `pending_consent` → `pending_review` → `published` / `hidden`.

## Тексти згоди (T-6006)

Єдине джерело узгоджених формулювань — `application/gallery-consent-copy.ts`:

- `CONSENT_PUSH` — push після `AppointmentCompleted` («Опублікувати фото вашої нової зачіски?»); без відповіді нагадування не повторюється (PRT-ADM-03).
- `CONSENT_SCREEN` — екран згоди; кнопка адресується доменним `ConsentOpinion`: `yes` → «Надати згоду (публічно)», `anonymous` → «Надати згоду (анонімно)», `no` → «Відмовитися».
- `publicationNotice` — повідомлення клієнту після модерації: `published` (подяка) і `hidden` (відхилено адміністратором, фото приватне); проміжні статуси клієнту не пишуть.

Тексти не дублюються в екранах: `content` і `notifications` беруть їх звідси.

## Aggregates (план, ще не код)

- `PortfolioItem` (статус, джерела-посилання, згода)

## Domain events (план)

- `PortfolioItemAdded` → адмінка (черга модерації)
- `PortfolioItemPublished` → `content` (сторінка барбера оновлюється), `notifications` (барберу)
- `PortfolioItemHidden` (приховування адміном або відкликання згоди клієнтом — миттєве)
- `ClientConsentRevoked` → миттєве приховування елементів клієнта

## Порти (план)

- `PortfolioItemRepository`
- `PhotoStorage` (той самий приватний bucket-принцип, що ADR 0008; публічна копія — окремий шлях, видаляється разом з елементом)

## Хто викликає

- Вхідні події: `scheduling.AppointmentCompleted` (поштовх запиту згоди через `notifications`)
- Mobile (барбер): додати елемент, відмітити згоду в кріслі, свої елементи
- Web (публіка): `/barbers/{slug}` — опублікована галерея барбера; `content` OHS
- Mobile (клієнт): вкладка «Роботи» барбера у флоу запису
- Admin: модерація, приховування, видалення

## Шарність

- `domain/` — Чиста модель. Без Nest, Prisma, HTTP, Expo. Тут entities, value objects, events, repository-порти.
- `application/` — Use cases: command/query, handlers, політики доступу. Транзакція = один use case.
- `infrastructure/` — Адаптери цього контексту (Prisma, HTTP, сховище фото). Зовнішні системи лише через ACL, не в domain.

Код домену не імпортує Nest, Prisma, React Native і HTTP-клієнти. Залежності спрямовані всередину: infrastructure → application → domain.

Публічний API контексту (коли з'явиться код) реекспортує domain + application, **не** infrastructure.