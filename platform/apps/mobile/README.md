# @fade/mobile — iOS і Android

Expo (React Native): один бінарій, ролі `client` і `barber`. Каркас зібрано (T-001) — бізнес-код додається за фазами.

## Призначення

| Роль | Екрани |
|------|--------|
| Клієнт | Телефон + OTP, блог, локація, запис, візити, чат, профіль |
| Барбер | Календар, картка клієнта, чат, статус візиту, блог |

Деталі: `docs/products.md`, ADR 0004. Приймальні критерії: `docs/acceptance-criteria/` (MOB- і BAR-сценарії: оплата, AI-підбір, референс у записі, бонус «7-й візит», відгуки після візиту). Флоу запису: `docs/booking-flow.md`.

## Запуск

З кореня платформи (Metro на порту 18081, щоб не конфліктувати з іншими проєктами):

```bash
pnpm --filter @fade/mobile dev    # expo start --port 18081
```

Навігація: Expo Router, групи `(client)` і `(barber)`.

Bundle id / package name: `com.barbershop.app` (`app.json`) — заглушка до фіналізації бренду, у стори не публікується.

## Залежності

- HTTPS + WebSocket до `apps/api`
- Блог: read-модель `content` (ті самі статті, що `apps/web`)
- Push: Expo Notifications
- Не ходити в Checkbox, Postgres напряму з клієнта
