# T-275 · Магазин: оплата і гроші

- **Stage**: M5 (phase 27, слайс 2 з 3) · **Tags**: backend, integration · **Complexity**: middle · **Depends on**: T-274, T-091 (еквайринг), T-092 (Checkbox-досвід)
- **StoryPoints**: 5

## What

`SHOP-022`: оплата карткою через еквайринг запису (новий тип платежу `order`, той самий `AcquiringGateway`); ідемпотентність подвійного кліку і повторна спроба після помилки — PAY-WEB-03/05/06-семантика; успіх → `OrderPaid` → статус «Збираємо». `SHOP-024`: чек ПРРО дистанційної торгівлі (порядок верифікований з Checkbox/бухгалтером **до старту слайсу** — відкрите питання). Скасування до відправки і refund-семантика PAY-005…010 (SHOP-025).

## Sources

- `SHOP-022, SHOP-024, SHOP-025`; README `billing` (тип `order`); `docs/online-shop.md` (ПРРО — відкрите питання)

## Done

- [ ] Оплата і refund замовлення працюють з чеками
- [ ] Лояльність послуг не зачеплена (тест)

## Risks

- [ ] **Тип платежу `order`**: не змішувати з депозитами запису
- [ ] **ПРРО дистанційної торгівлі**: верифікувати (відкрите рішення #5)

## Re-verified at d92ff74d

Blocked by T-270: there is no shop order to pay for at `d92ff74d` — `apps/api/src/shop` and the shop
Prisma models do not exist, so `shop-order-payment.spec.ts` (in review `a37349cf`) tests the payment
use case with a synthetic order, not a paid shop checkout.
