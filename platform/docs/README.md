# Документація платформи

| Документ | Зміст |
|----------|--------|
| [architecture.md](architecture.md) | Контейнери, шари, система правди |
| [engineering-principles.md](engineering-principles.md) | Інженерні принципи: DDD/SOLID/DRY/KISS/YAGNI, жорсткі обмеження (target LOC < 100 — ADR 0019), піраміда тестів і ковередж-гейти CI |
| [review-checklist.md](review-checklist.md) | Чекліст рев'ю PR на одну сторінку: гейти, шари, порти, тести, UI-токени, скоуп |
| [design-system.md](design-system.md) | Дизайн-система: токени (темна тема, типографіка, статуси), компоненти зі станами, UX-політики, governance; імплементація — T-004 |
| [components/](components/README.md) | Сторінки-документи компонентів `@fade/ui`: API, стани, приклад, do/don't (рішення T-004 — Markdown) |
| [products.md](products.md) | Сайт (публічний + кабінет OTP), admin, mobile |
| [admin-screens.md](admin-screens.md) | Екрани адмінки: локації, барбери, послуги/ціни, години роботи |
| [booking-flow.md](booking-flow.md) | Флоу запису клієнта: послуга → [режим пакета] → барбер → слот → зачіска/коментар → оплата |
| [booking-flow-tests.md](booking-flow-tests.md) | Приймальні e2e-сценарії флоу запису: Given/When/Then по кожному екрану (0–5) + гілки |
| [client-screens.md](client-screens.md) | Екрани клієнта (mobile): головна, локації, послуги, мої візити, профіль |
| [client-journey.md](client-journey.md) | Клієнтський шлях end-to-end: запис → AI → оплата → візит → відгук → лояльність |
| [campaigns.md](campaigns.md) | Win-back-кампанії: сегменти CRM → промокод + push одним кліком |
| [gift-certificates.md](gift-certificates.md) | Подарункові сертифікати: купівля, баланс, погашення (гроші входять до послуги) |
| [referrals.md](referrals.md) | Реферальна програма: «приведи друга» — знижка обом сторонам |
| [online-shop.md](online-shop.md) | Онлайн-магазин: вітрина → shop-lite («забронювати до каси») → повний e-commerce; домени і спільна авторизація — ADR 0017 |
| [web-screens.md](web-screens.md) | Екрани публічного сайту: головна (hero + стрічка слотів), локації, послуги/ціни, барбери |
| [web-cabinet-screens.md](web-cabinet-screens.md) | Екрани кабінету клієнта (web): `/login` OTP, профіль, «Мої візити» з оплатою/відгуком/перенесенням |
| [barber-screens.md](barber-screens.md) | Екрани барбера (mobile): walk-in, календар дня/тижня, картка візиту (референс + статуси), картка клієнта, self-service графік |
| [bounded-contexts.md](bounded-contexts.md) | Межі та карта контекстів |
| [seeding.md](seeding.md) | Сід dev/test/e2e-середовищ: інвентар скриптів, пайплайн (seed → customers → appointments → seed:e2e), інваріанти (час ковзає, ціна локації, без outbox/OTP) |
| [uuid-data-migration.md](uuid-data-migration.md) | План expand/contract для UUID-міграції (T-4300c): рішення «нуль бойових даних», чекліст перевірки, відкат на крок, ризики |
| [ubiquitous-language.md](ubiquitous-language.md) | Словник для коду |
| [roadmap.md](roadmap.md) | Фази імплементації |
| [../backlog/README.md](../backlog/README.md) | Карта беклогу. Статуси — у `backlog/index/` (один файл на етап), специфікація — `backlog/tasks/T-NNN-*` |
| [acceptance-criteria/](acceptance-criteria/) | Приймальні критерії по фічах і поверхнях (web, mobile, admin) |
| [adr/](adr/) | Рішення |
