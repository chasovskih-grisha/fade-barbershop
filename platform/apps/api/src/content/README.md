# Контент і блог (`content`)

> Тип піддомену: **Supporting**

Статті, автори, теги. Одна система правди для **сайту і мобільного додатка**. SEO живе на web (канонічний URL); додаток читає ті самі опубліковані статті через API.

## Ubiquitous language

- **Article** — публікація блогу (чернетка / опубліковано).
- **Author** — автор (засновник або барбер).
- **Tag** — тематична мітка.
- **Slug** — унікальний і незмінний URL-ідентифікатор статті; дубль → `ArticleSlugTakenError`.
- **Excerpt** — анонс: стрічка блогу, OG-теги, `description`.

## Команди (мовою домену, не `setStatus`)

- `DraftArticle` — створює чернетку; подія `content.article.drafted`.
- `UpdateArticle` — часткова правка полів; публікацію не знімає.
- `PublishArticle` — публікує; **лишає дату першої публікації**, тож стрічка не «стрибає» при повторній публікації; подія `content.article.published`.
- `UnpublishArticle` — назад у чернетки (не видалення); подія `content.article.unpublished`.

## Запити

- Адмін: `ListArticles` (усі статуси), `GetArticle`.
- Публічні: `ListPublishedArticles`, `GetPublishedArticle` — **лише** опубліковані; чернетка за slug = `ArticleNotFoundError` (404, а не 403: гість не має знати, що стаття існує).

## Aggregates (реалізовано 2026-09-28, T-031)

- `Article` — `slug` (унікальний), `title`, `excerpt`, `body`, `coverUrl`, `authorName`, `tags`, `status` (`draft|published`), `publishedAt`.
- `ArticleBlock` — тіло статті у блоках (T-2300a): `paragraph`, `heading` (2–3), `list`, `quote`, `image` (з обов'язковим `alt`). Клієнти малюють блоки, а не виконують HTML. `parseArticleBody` — чиста функція домену; сирий HTML, `h1`, `javascript:`-посилання і зображення без `alt` — помилка публікації (`InvalidArticleBodyError`), а не «тихо почищено».

## Domain events

- `ArticleDrafted` · `ArticlePublished` · `ArticleUnpublished` → transactional outbox (`aggregateType: 'article'`); підписки мають бути ідемпотентними (ADR 0009).

## Порти

- `ArticleRepository`, `Clock`, `IdGenerator`, `Outbox`, `UnitOfWork` (транзакція = один use case)

## Хто викликає

- `apps/admin` — CMS (чернетка, публікація)
- `apps/web` — публічний блог, канонічні URL, sitemap
- `apps/mobile` — стрічка і стаття (клієнт і барбер; читання без окремого логіну)

Не дублювати статті в MD-файлах додатка. Немає «іншого блогу» для mobile.

## Шарність

- `domain/` — Чиста модель. Без Nest, Prisma, HTTP, Expo. Тут entities, value objects, events, repository-порти.
- `application/` — Use cases: command/query, handlers, політики доступу. Транзакція = один use case.
- `infrastructure/` — Адаптери цього контексту (Prisma, HTTP, черга). Зовнішні системи лише через ACL, не в domain.

Код домену не імпортує Nest, Prisma, React Native і HTTP-клієнти. Залежності спрямовані всередину: infrastructure → application → domain.

## Інваріанти (закріплені доменом і БД)

- `publishedAt IS NOT NULL` для опублікованої статті — CHECK у міграції + домен.
- Slug унікальний — унікальний індекс у БД, `ArticleSlugTakenError` у домені (409 у CMS).
- Чернетка ніколи не потрапляє в публічну вибірку — гарантує запит, а не фільтр контролера.

## Що далі (T-2300, ADR 0026 accepted)

Свій `content`, без headless CMS. Категорій немає — тег лишається єдиною міткою, окремої таблиці `Tag` не буде.

- Модель (блоки markdown, alt, SEO-поля, автор, обрана, редірект slug) — T-2300a.
- Читання на сайті — T-2300b. Пошук, архів тегу, сторінки — T-2300e.
- Sitemap, RSS, 301, скидання кешу — T-2300c.
- Прев'ю, відкладена публікація, ревізії — T-2300d.
- Той самий API у застосунку — T-2300f.
- Переклад полів через `Translation` — T-2300g (таблиця — T-4613a).
- Пов'язані послуги — T-4473. `SeoBlock` сторінок — T-4416.
- Розсилки нових статей немає. Коментарів немає.

## Тести

- `domain/article.spec.ts` — інваріанти агрегату (8).
- `application/content.spec.ts` — сценарії use cases (12).
- `e2e/content-flow-gwt.e2e.spec.ts` — життєвий цикл статті через HTTP (5).

Контракти DTO — у `packages/contracts/src/content.ts` (клієнти web/admin беруть типи звідти, не з домену API).
