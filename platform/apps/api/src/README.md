# API — модульний моноліт

Один процес, кілька bounded contexts. Не мікросервіси.

```
src/
├── identity/          # хто користувач
├── locations/         # точки мережі
├── catalog/           # послуги і ціни
├── scheduling/        # календар і записи (core)
├── crm/               # картки клієнтів (core)
├── messaging/         # чат клієнт ↔ барбер (core)
├── content/           # блог
├── billing/           # оплата + ПРРО (ACL)
├── haircut-ai/        # AI-підбір зачісок за фото (ACL провайдера)
├── loyalty/           # бонус «кожен 7-й візит»
├── feedback/          # відгуки клієнтів про завершені візити
├── discounts/         # промокоди, правила і VIP-знижки
├── analytics/         # KPI-проєкції дашборду засновника (read-model)
├── portfolio/         # публічна галерея робіт «до/після» (згода + модерація)
├── gift-certificates/ # передплачені сертифікати (платіжний інструмент, ADR 0013)
├── notifications/     # push / SMS / email
├── shared/            # мінімальний shared kernel
└── main.ts            # composition root
```

Кожен контекст: `domain/` → `application/` → `infrastructure/`.

Контексти спілкуються **через application handlers і доменні/інтеграційні події**, не через імпорт чужих entity.
