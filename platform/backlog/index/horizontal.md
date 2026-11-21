# Індекс горизонтальні задачі

Статуси задач цього етапу. Карта беклогу — у [README](../README.md). Новий рядок додається сюди.

### Горизонтальні (постійні)

| ID | Задача | Джерело | Теги | Складність | Статус |
|----|--------|---------|------|-----------|--------|
| [T-4614](../tasks/T-4614-preopening-production-mvp.md) | Pre-opening MVP: сайт, адмінка і API в проді з нульовим каталогом (після знака FADE) | рішення засновника 2026-10-02, ADR 0051/0052, web-screens.md | frontend, backend, devops, high-risk | senior | todo |
| [T-4614a](../tasks/T-4614a-production-images.md) | └ Слайс: прод-образи api/web/admin, не dev (5 SP) | T-4614 | devops, infra | middle | review |
| [T-4614b](../tasks/T-4614b-empty-prod-database.md) | └ Слайс: stage/prod без демо-сіду (5 SP) | T-4614 | devops, backend | middle | todo |
| [T-4614c](../tasks/T-4614c-stage-prod-autodeploy.md) | └ Слайс: підключити автодеплой stage → prod (5 SP) | T-4614 | devops, infra, high-risk | middle | todo |
| [T-4614e](../tasks/T-4614e-preopening-site.md) | └ Слайс: вітрина порожнього каталогу (5 SP) | T-4614 | frontend, design | middle | in_progress |
| [T-4614f](../tasks/T-4614f-admin-empty-database.md) | └ Слайс: адмінка на порожній базі (5 SP) | T-4614 | frontend, backend | middle | todo |
| [T-300](../tasks/T-300-monitoring-security.md) | Моніторинг, бекапи, секрети, персональні дані | roadmap чеклист, ADR 0005/0008/0015 | infra, devops | senior | review |
| [T-6011](../tasks/T-6011-t-300-implementation-plan-missing.md) | Defect: T-300 missing implementation plan verification checks | — | — | junior | todo |
| [T-301](../tasks/T-301-e2e-booking-tests.md) | Автоматизація GWT-сценаріїв флоу запису | booking-flow-tests.md | integration | middle | todo |
| [T-302](../tasks/T-302-unit-economics-review.md) | Рев'ю економіки за даними дашборда (кожен місяць) | ANL-*, unit-economics.md | — | — | todo |
| [T-303](../tasks/T-303-staging-prod-deploy.md) | Staging і прод: деплой, домени, SSL, пошта (фінальні кроки) | roadmap чеклист, ADR 0017/0018/0051/0052 | infra, devops | senior | done |
| [T-4531](../tasks/T-4531-staging-gate.md) | Staging: середовище stage.fade.com.ua як обов'язковий гейт перед продом (DNS/SSL, CORS, cookie-ізоляція) | рішення засновника 2026-09-25, ADR 0017/0018/0052 | infra, devops, security | middle | todo |
| [T-2000](../tasks/T-2000-mcp-integration.md) | MCP-сервер платформи (безпечні інструменти для зовнішніх AI-агентів) | ADR 0020/0021, AC 24 | backend, integration, experimental | middle | todo |
| [T-2001](../tasks/T-2001-mcp-tools-extension.md) | Розширення інструментів MCP-сервера (клієнти, барбери, лояльність, записи) | ADR 0020/0009, AC 24 | backend, integration, experimental | middle | todo |
| [T-2105](../tasks/T-2105-testing-strategy.md) | Комплексна стратегія тестування (піраміда, coverage-гейти CI, хаос) | engineering-principles.md, booking-flow-tests.md | quality, devops | senior | done |
| [T-284](../tasks/T-284-ai-personalization.md) | AI-персоналізація (рекомендації послуг, пропозиції консьєржа, AI-описи CMS) | ADR 0020/0008, AC 24 | backend, experimental, high-risk | senior | todo |
| [T-4801](../tasks/T-4801-distributed-tracing.md) | Distributed Tracing & OpenTelemetry integration | architecture.md, observability.md | backend, infra, observability | senior | review |
| [T-4802](../tasks/T-4802-redis-distributed-lock.md) | Redis Distributed Lock & Slot Race-Condition Resilience | scheduling README, T-040 | backend, scheduling, high-risk | senior | review |
| [T-4803](../tasks/T-4803-pgbouncer-pooling.md) | Database Connection Pooling Tuning with PgBouncer | architecture.md, engineering-principles.md | backend, database, infra | middle | review |
| [T-4804](../tasks/T-4804-appointment-partitioning.md) | Automated Partitioning & Archiving for Appointments | architecture.md, T-042 | backend, database, maintenance | senior | review |
| [T-4805](../tasks/T-4805-gdpr-anonymization.md) | GDPR Right-to-Be-Forgotten & PII Anonymization Pipeline | security-hardening.md, ADR 0005/0018 | backend, security, compliance | senior | review |
| [T-4806](../tasks/T-4806-csp-security-headers.md) | Content Security Policy (CSP) & Secure HTTP Headers Hardening | security-hardening.md, engineering-principles.md | frontend, security, devops | middle | todo |
| [T-4807](../tasks/T-4807-container-security-ci.md) | Container Vulnerability Scanning & Secret Detection in CI | security-hardening.md, engineering-principles.md | devops, security, ci | middle | review |
| [T-4808](../tasks/T-4808-nextjs-isr-caching.md) | Next.js ISR Caching & Edge Optimization for Public Pages | roadmap, ux-guidelines, T-030 | frontend, performance, seo | middle | todo |
| [T-4809](../tasks/T-4809-k6-load-testing.md) | Automated Availability Engine Benchmark & k6 Load Testing Suite | slo.md, engineering-principles.md, T-040 | testing, performance, reliability | senior | todo |
| [T-4810](../tasks/T-4810-playwright-e2e-booking.md) | Comprehensive Playwright E2E Test Suite for Booking & Party | booking-flow-tests.md, testing-guidelines.md, T-041 | testing, frontend, qa | senior | todo |
| [T-4811](../tasks/T-4811-dynamic-surge-pricing.md) | Real-Time Surge & Dynamic Pricing Engine — backend (правила, міграція, снепшот на Booking, PUT/GET) + адмін-екран `settings/surge-pricing`; відкрито: occupancy-based множники | roadmap, T-024, T-040 | backend, pricing, business | senior | review |
| [T-4812](../tasks/T-4812-db-migration-safety.md) | Automated Database Migration Safety & Rollback Validation in CI | architecture.md, engineering-principles.md | backend, database, devops | senior | review |
