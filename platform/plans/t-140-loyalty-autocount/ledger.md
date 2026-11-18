# SDD ledger — plan: T-140 loyalty autocount

- 2026-10-08T10:10:00Z: setup — прочитав контекст, створив контекст-файл. База для юнітів: `crmHandlersSetup()`, для e2e: `crmTestingModule()`.
- 2026-10-08T10:11:00Z: RULE — ідемпотентність підписника по `appointmentId`, а не за `clientId`, бо один клієнт може мати багато візитів, а релей може доставляти одну подію багато разів.
- 2026-10-08T10:12:00Z: RULE — подія `LoyaltyVisitsIncremented` окрема від `LoyaltyVisitsChanged`, бо `changed` — ручна зміна адміном, `incremented` — авто-нарахування; вони не сумісні semantic.
- 2026-10-08T10:13:00Z: RULE — використати наявний `crmHandlersSetup()` для юнітів, не заводити окремий фейк, щоб повторне використання було в одного файла.
- 2026-10-08T10:14:00Z: файл контексту у `plans/t-140-loyalty-autocount/context.md`, файли планів — у `plans/t-140-loyalty-autocount/`.
- 2026-10-08T10:15:00Z: файли плану: `plans/t-140-loyalty-autocount/README.md`, `plans/t-140-loyalty-autocount/steps.md`, `plans/t-140-loyalty-autocount/spec.md`.
- 2026-10-08T10:16:00Z: план і спе перевірені — імпорт, типи, ідемпотентність, журнал, фейки вже є; нові файли не потрібні окрім use case і події.
- 2026-10-08T10:17:00Z: файли планів закомічені окремо, контекст-файл залишено на гілці для фінал-рев'ю.
