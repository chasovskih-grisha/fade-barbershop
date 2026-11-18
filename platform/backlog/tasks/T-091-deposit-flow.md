# T-091 · Депозит 30% (ідемпотентно), статуси оплати

- **Stage**: M2 (phase 8) · **Tags**: backend, integration · **Complexity**: senior · **Depends on**: T-090
- **StoryPoints**: 8

## What

Оплата депозита при записі (30% `FinalPrice`, округлення 10 грн, політика-снепшот PAY-ADM-09): `Payment` `initiated → captured → …`, `PaymentCaptured` → booked→confirmed (точка синхронізації життєвого циклу); ідемпотентність подвійного кліку (PAY-WEB-03); помилки еквайрингу — «гроші не списані» + повтор (PAY-WEB-05/06); кабінет: статуси, чеки (PAY-WEB-01…08); `ComplimentaryVisit` (FinalPrice=0) — без Payment, підтвердження одразу (PAY-003).

## Sources

- `PAY-001…004`, `PAY-WEB-01…08`, `PAY-ADM-09`; scheduling README (точки синхронізації)

## Done

- [ ] Депозит працює end-to-end з еквайрингом
- [ ] Ідемпотентність і помилкові гілки покриті тестами

## Risks

- [ ] **Еквайринг**: refund-потік верифікувати до вибору провайдера (PAY-009)
- [ ] **Вебхуки**: підпис, ідемпотентність, replay

