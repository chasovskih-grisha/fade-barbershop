# T-4446a · Add to calendar: client-owned ICS feed

- **Stage**: M3 (phase 7) · **Tags**: backend · **Complexity**: middle · **Depends on**: T-032, T-4408
- **StoryPoints**: 3

## What

Слайс T-4446 для API: клієнт отримує `.ics`-файл **свого** візиту, який відкриває системний календар.

- `GET /booking/appointments/:id/calendar.ics` — лише власник візиту (сесія клієнта), інакше `401`/`404`.
- Час — абсолютний момент у UTC (`DTSTART:...Z`), а не плаваючий локальний: подія показується правильно в будь-якому поясі, включно з переходами на літній/зимовий час.
- Стабільний `UID` на візит + `SEQUENCE` з версії візиту: повторний імпорт після перенесення оновлює ту саму подію; скасований візит віддається зі `STATUS:CANCELLED`.
- Read-модель «Моїх візитів» віддає `startsAt`/`endsAt` (ISO), щоб веб міг побудувати посилання без нового запиту.

## Sources

- T-4446 (`booking-flow.md`, `client-screens.md`); RFC 5545; `calendar-ics.ts`

## Implementation plan

- `apps/api/src/scheduling/infrastructure/calendar-ics.ts`
- `apps/api/src/scheduling/infrastructure/calendar-export.controller.ts`
- `apps/api/src/scheduling/infrastructure/client-appointment-calendar.controller.ts`
- `apps/api/src/scheduling/application/client-appointments.view.ts`
- `apps/api/src/scheduling/application/list-client-appointments.ts`
- `apps/api/src/booking/booking.module.ts`
- `apps/api/src/scheduling/infrastructure/calendar-ics.spec.ts`
- `apps/api/src/scheduling/infrastructure/client-appointment-calendar.controller.spec.ts`

Checks:

- `pnpm --filter @fade/api exec jest --runTestsByPath $PWD/apps/api/src/scheduling/infrastructure/calendar-ics.spec.ts $PWD/apps/api/src/scheduling/infrastructure/client-appointment-calendar.controller.spec.ts --forceExit`

## Done

- [x] ICS-посилання генерується для власного візиту (UTC→абсолютний момент, зона локації в описі)
- [x] Скасування/перенос оновлює подію (стабільний UID + SEQUENCE + STATUS)
- [x] Тест часових зон (DST)

## Risks

- [x] **Спам подій**: повторний клік не створює дубль (`UID` на візит)

## Out of scope

- Посилання в UI (T-4446b)
- Підписка на календар барбера з токеном (T-4540)

## Implementation notes

- apps/api/src/scheduling/infrastructure/calendar-ics.spec.ts
- apps/api/src/scheduling/infrastructure/calendar-ics.ts
- apps/api/src/scheduling/infrastructure/client-appointment-calendar.controller.spec.ts
- apps/api/src/scheduling/infrastructure/client-appointment-calendar.controller.ts

## QA

- `pnpm --filter @fade/api exec jest --runTestsByPath $PWD/apps/api/src/scheduling/infrastructure/calendar-ics.spec.ts $PWD/apps/api/src/scheduling/infrastructure/client-appointment-calendar.controller.spec.ts --forceExit` exit 0
