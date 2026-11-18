# T-110 · Контекст `analytics`: KPI-проекції

- **Stage**: M3 (phase 14, жорстка вимога v1) · **Tags**: backend · **Complexity**: middle · **Depends on**: T-042 (події), T-091 (платежі)
- **StoryPoints**: 5

## What

Read-model проекції на подіях (ідемпотентно, патерн ADR 0009): RevenuePerDay, ChairOccupancy, AvgTicket, NoShowRate, CancellationRate, ConversionRate, RepeatBookingRate, ChairHourRevenue, DiscountLeakage (включно з вартістю безкоштовних візитів); вхідні події з README `analytics`. Розширення фаз 16–22 (no-show-канали, waitlist, кампанії, сертифікати, referral) — додаються у свої фази.

## Sources

- `ANL-001…010`; analytics README (терміни, вхідні події); roadmap (жорстка вимога v1)

## Done

- [ ] Read-model проекції на подіях працюють ідемпотентно (патерн ADR 0009)
- [ ] RevenuePerDay проекція збирається з `billing.PaymentCaptured`
- [ ] ChairOccupancy проекція розраховує хвилини крісел коректно
- [ ] AvgTicket проекція працює
- [ ] NoShowRate проекція розраховує коректно
- [ ] ConversionRate проекція працює
- [ ] DiscountLeakage проекція включає вартість безкоштовних візитів
- [ ] CancellationRate з `AppointmentCancelled`; перенесення не входить у чисельник
- [ ] RepeatBookingRate на `AppointmentCompleted`: у клієнта вже є запис зі стартом пізніше за кінець цього візиту
- [ ] ChairHourRevenue = виручка / доступні години крісла (знаменник ChairOccupancy у годинах)
- [ ] Проекції збираються з подій; повторна доставка не ламає суми (ідемпотентність)
- [ ] KPI відповідають формулам README analytics
- [ ] Вхідні події з README `analytics` обробляються коректно
- [ ] Юніт-Tests на ідемпотентність та edge cases
- [ ] Інтеграційні Tests з подіями scheduling та billing

## Risks

- [ ] **complexity розрахунків**: ChairOccupancy (хвилини крісел) може бути складною для розрахунку
- [ ] **Ідемпотентність**: Повторна доставка подій може ламати суми якщо патерн Implemented неправильно
- [ ] **Вартість безкоштовних візитів**: DiscountLeakage має включати вартість безкоштовних візитів коректно
- [ ] **Залежність від T-042/T-091**: Затримка в подіях або платежах блокує жорстку вимогу v1
- [ ] **Розширення фаз 16–22**: Нові події потребують оновлення проекцій у майбутньому
- [ ] **Продуктивність**: Проекції на подіях можуть бути повільними при великому обсязі даних

## Розбивка (слайси, жорстка вимога v1)

1. **RevenuePerDay + AvgTicket** *(junior)* (з `billing.PaymentCaptured`) — перша корисна картка ще до повної фази 8. Сума по днях + середній чек — ідеальне Task на входження в кодову базу: копіює патерн обробника-еталона з T-042.
2. **NoShowRate + ConversionRate** *(junior/middle)* (з подій `scheduling`) — знаменники і ділення на нуль — головна complexity.
3. **ChairOccupancy + DiscountLeakage** *(middle)* (найскладніші: хвилини крісел; вартість безкоштовних візитів) — саме тут middle-розробник переростає у senior.
4. **CancellationRate + RepeatBookingRate + ChairHourRevenue** *(middle)* (ANL-008…010) — скасування з `AppointmentCancelled`; повторний запис читає стан `scheduling` на момент завершення; грн/год ділить ту саму виручку на години знаменника ChairOccupancy.

Дашборд (T-111) можна показувати ітеративно — по мірі готовності карток, без очікування всіх дев’яти. Патерн ідемпотентності — копіюється з обробника-еталона T-042, а не вигадується заново.
